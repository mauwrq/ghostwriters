// Game rules as pure functions. The host's browser calls these to decide what
// happens next, then writes the returned updates to Firebase.
import { PROMPTS } from './prompts'
import { sortedPlayers } from './room'
import { MAX_ANSWER_LENGTH, type Room, type RoundResult } from './types'

export const ANSWER_MS = 60_000
export const VOTE_MS = 30_000
export const REVEAL_MS = 6_000
export const REVEAL_PER_WINNER_MS = 4_000
export const SCORES_MS = 8_000

export const POINTS_PER_VOTE = 100
export const WINNER_BONUS = 200
export const MIN_ANSWERS_TO_VOTE = 2

export type Answers = Record<string, string>
export type Votes = Record<string, string>
// Paths relative to rooms/{CODE}, for a Firebase multi-path update.
export type Updates = Record<string, unknown>

export function roundAnswers(room: Room): Answers {
  return room.answers?.[room.round] ?? {}
}

export function roundVotes(room: Room): Votes {
  return room.votes?.[room.round] ?? {}
}

export function roundResult(room: Room): RoundResult {
  return room.results?.[room.round] ?? {}
}

export function cleanAnswer(input: string): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, MAX_ANSWER_LENGTH).trim()
}

// Votes for yourself or for someone who didn't answer don't count.
export function tallyVotes(answers: Answers, votes: Votes): { winners: string[]; voteCounts: Record<string, number> } {
  const voteCounts: Record<string, number> = {}
  for (const id of Object.keys(answers)) voteCounts[id] = 0
  for (const [voterId, targetId] of Object.entries(votes)) {
    if (voterId === targetId || !(targetId in voteCounts)) continue
    voteCounts[targetId]++
  }
  const top = Math.max(0, ...Object.values(voteCounts))
  const winners = top === 0 ? [] : Object.keys(voteCounts).filter((id) => voteCounts[id] === top)
  return { winners, voteCounts }
}

export function roundPoints(result: RoundResult): Record<string, number> {
  const points: Record<string, number> = {}
  for (const [id, count] of Object.entries(result.voteCounts ?? {})) {
    if (count > 0) points[id] = count * POINTS_PER_VOTE
  }
  for (const id of result.winners ?? []) points[id] = (points[id] ?? 0) + WINNER_BONUS
  return points
}

export function pickPromptIndex(count: number, used: number[], random: () => number = Math.random): number {
  const fresh = Array.from({ length: count }, (_, i) => i).filter((i) => !used.includes(i))
  const pool = fresh.length > 0 ? fresh : Array.from({ length: count }, (_, i) => i)
  return pool[Math.floor(random() * pool.length)]
}

// Same order on every device, so players can talk about "the third one".
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const random = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function connectedPlayerIds(room: Room): string[] {
  return sortedPlayers(room.players)
    .filter(([, p]) => p.connected)
    .map(([id]) => id)
}

// True once every connected player has answered (or voted), so the host
// doesn't have to wait for the timer.
export function isPhaseComplete(room: Room): boolean {
  const ids = connectedPlayerIds(room)
  if (ids.length === 0) return false
  if (room.phase === 'answering') return ids.every((id) => id in roundAnswers(room))
  if (room.phase === 'voting') return ids.every((id) => id in roundVotes(room))
  return false
}

function beginRound(round: number, used: number[], now: number, random: () => number): Updates {
  const index = pickPromptIndex(PROMPTS.length, used, random)
  return {
    phase: 'answering',
    round,
    prompt: PROMPTS[index],
    usedPrompts: [...used, index],
    phaseEndsAt: now + ANSWER_MS,
  }
}

function resetScores(room: Room): Updates {
  const updates: Updates = { answers: null, votes: null, results: null }
  for (const [id] of sortedPlayers(room.players)) updates[`players/${id}/score`] = 0
  return updates
}

export function startGame(room: Room, now: number, random: () => number = Math.random): Updates {
  return { ...resetScores(room), gameStartedAt: now, ...beginRound(1, [], now, random) }
}

export function backToLobby(room: Room): Updates {
  return {
    ...resetScores(room),
    phase: 'lobby',
    round: 0,
    prompt: '',
    phaseEndsAt: null,
    usedPrompts: null,
  }
}

// What the host writes when the current phase ends.
export function nextPhase(room: Room, now: number, random: () => number = Math.random): Updates {
  switch (room.phase) {
    case 'answering': {
      if (Object.keys(roundAnswers(room)).length < MIN_ANSWERS_TO_VOTE) {
        return { phase: 'reveal', phaseEndsAt: now + REVEAL_MS, [`results/${room.round}`]: { skipped: true } }
      }
      return { phase: 'voting', phaseEndsAt: now + VOTE_MS }
    }
    case 'voting': {
      const result = tallyVotes(roundAnswers(room), roundVotes(room))
      const updates: Updates = {
        phase: 'reveal',
        phaseEndsAt: now + REVEAL_MS + REVEAL_PER_WINNER_MS * result.winners.length,
        [`results/${room.round}`]: result,
      }
      for (const [id, points] of Object.entries(roundPoints(result))) {
        updates[`players/${id}/score`] = (room.players?.[id]?.score ?? 0) + points
      }
      return updates
    }
    case 'reveal':
      return { phase: 'scores', phaseEndsAt: now + SCORES_MS }
    case 'scores':
      return room.round < room.totalRounds
        ? beginRound(room.round + 1, room.usedPrompts ?? [], now, random)
        : { phase: 'final', phaseEndsAt: null }
    default:
      return {}
  }
}

export function finalWinners(room: Room): string[] {
  const players = sortedPlayers(room.players)
  const top = Math.max(0, ...players.map(([, p]) => p.score))
  return top === 0 ? [] : players.filter(([, p]) => p.score === top).map(([id]) => id)
}
