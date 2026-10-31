// Game rules as pure functions. The host's browser calls these to decide what
// happens next, then writes the returned updates to Firebase.
import { PROMPTS } from './prompts'
import { sortedPlayers } from './room'
import { MAX_ANSWER_LENGTH, MAX_QUESTION_LENGTH, type Phase, type Room, type RoundResult } from './types'

export const PROMPT_VOTE_MS = 20_000
export const QUESTION_WRITE_MS = 45_000
export const QUESTION_VOTE_MS = 20_000
// Countdown once everyone has voted on a question; votes can still change.
export const LOCK_IN_MS = 3_000
export const ANSWER_MS = 60_000
export const VOTE_MS = 30_000
export const REVEAL_MS = 6_000
export const REVEAL_PER_WINNER_MS = 4_000
export const SCORES_MS = 8_000

export const PROMPT_OPTION_COUNT = 3
// The board option that lets players write their own question.
export const CUSTOM_OPTION = 'custom'

export const POINTS_PER_VOTE = 100
export const WINNER_BONUS = 200
export const MIN_ANSWERS_TO_VOTE = 2

export type Answers = Record<string, string>
export type Votes = Record<string, string>
// Paths relative to rooms/{CODE}, for a Firebase multi-path update.
export type Updates = Record<string, unknown>
type Random = () => number

export function roundAnswers(room: Room): Answers {
  return room.answers?.[room.round] ?? {}
}

export function roundVotes(room: Room): Votes {
  return room.votes?.[room.round] ?? {}
}

export function roundResult(room: Room): RoundResult {
  return room.results?.[room.round] ?? {}
}

export function roundPromptVotes(room: Room): Votes {
  return room.promptVotes?.[room.round] ?? {}
}

export function roundQuestions(room: Room): Answers {
  return room.questions?.[room.round] ?? {}
}

export function roundQuestionVotes(room: Room): Votes {
  return room.questionVotes?.[room.round] ?? {}
}

function cleanText(input: string, max: number): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, max).trim()
}

export function cleanAnswer(input: string): string {
  return cleanText(input, MAX_ANSWER_LENGTH)
}

export function cleanQuestion(input: string): string {
  return cleanText(input, MAX_QUESTION_LENGTH)
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

// The most-voted option, with ties broken at random. null if nobody voted.
export function pickMostVoted(options: string[], votes: Votes, random: Random = Math.random): string | null {
  const counts = new Map(options.map((o) => [o, 0]))
  for (const choice of Object.values(votes)) {
    if (counts.has(choice)) counts.set(choice, counts.get(choice)! + 1)
  }
  const top = Math.max(0, ...counts.values())
  if (top === 0) return null
  return pickRandom(options.filter((o) => counts.get(o) === top), random)
}

function pickRandom<T>(items: T[], random: Random): T {
  return items[Math.floor(random() * items.length)]
}

export function roundPoints(result: RoundResult): Record<string, number> {
  const points: Record<string, number> = {}
  for (const [id, count] of Object.entries(result.voteCounts ?? {})) {
    if (count > 0) points[id] = count * POINTS_PER_VOTE
  }
  for (const id of result.winners ?? []) points[id] = (points[id] ?? 0) + WINNER_BONUS
  return points
}

// Prompts for the board: unused ones first, topped up with used ones when
// the list runs low.
export function pickPromptOptions(total: number, used: number[], count: number, random: Random = Math.random): number[] {
  const all = Array.from({ length: total }, (_, i) => i)
  const fresh = shuffle(all.filter((i) => !used.includes(i)), random)
  const stale = shuffle(all.filter((i) => used.includes(i)), random)
  return [...fresh, ...stale].slice(0, count)
}

function shuffle<T>(items: T[], random: Random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Same order on every device, so players can talk about "the third one".
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return shuffle(items, () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  })
}

export function connectedPlayerIds(room: Room): string[] {
  return sortedPlayers(room.players)
    .filter(([, p]) => p.connected)
    .map(([id]) => id)
}

// Who has finished the current phase (answered, voted, or written).
export function doneIds(room: Room): string[] {
  switch (room.phase) {
    case 'promptVote':
      return Object.keys(roundPromptVotes(room))
    case 'questionWrite':
      return Object.keys(roundQuestions(room))
    case 'questionVote':
      return Object.keys(roundQuestionVotes(room))
    case 'answering':
      return Object.keys(roundAnswers(room))
    case 'voting':
      return Object.keys(roundVotes(room))
    default:
      return []
  }
}

// True once every connected player is done, so the host doesn't have to wait
// for the timer.
export function isPhaseComplete(room: Room): boolean {
  const ids = connectedPlayerIds(room)
  const done = doneIds(room)
  return ids.length > 0 && done.length > 0 && ids.every((id) => done.includes(id))
}

// Question votes end with a short countdown instead of moving on instantly.
export function hasLockIn(phase: Phase): boolean {
  return phase === 'promptVote' || phase === 'questionVote'
}

export function lockIn(room: Room, now: number): Updates {
  return { lockingIn: true, phaseEndsAt: Math.min(room.phaseEndsAt ?? Infinity, now + LOCK_IN_MS) }
}

function beginRound(round: number, room: Room, now: number, random: Random): Updates {
  return {
    phase: 'promptVote',
    round,
    prompt: '',
    promptOptions: pickPromptOptions(PROMPTS.length, room.usedPrompts ?? [], PROMPT_OPTION_COUNT, random),
    lockingIn: null,
    phaseEndsAt: now + PROMPT_VOTE_MS,
  }
}

function beginAnswering(prompt: string, now: number): Updates {
  return { phase: 'answering', prompt, lockingIn: null, phaseEndsAt: now + ANSWER_MS }
}

function answerListedPrompt(room: Room, index: number, now: number): Updates {
  return { ...beginAnswering(PROMPTS[index], now), usedPrompts: [...(room.usedPrompts ?? []), index] }
}

function resetGame(room: Room): Updates {
  const updates: Updates = {
    answers: null,
    votes: null,
    results: null,
    promptVotes: null,
    questions: null,
    questionVotes: null,
    usedPrompts: null,
    lockingIn: null,
  }
  for (const [id] of sortedPlayers(room.players)) updates[`players/${id}/score`] = 0
  return updates
}

export function startGame(room: Room, now: number, random: Random = Math.random): Updates {
  const fresh = { ...room, usedPrompts: [] }
  return { ...resetGame(room), gameStartedAt: now, ...beginRound(1, fresh, now, random) }
}

export function backToLobby(room: Room): Updates {
  return { ...resetGame(room), phase: 'lobby', round: 0, prompt: '', phaseEndsAt: null, promptOptions: null }
}

// What the host writes when the current phase ends.
export function nextPhase(room: Room, now: number, random: Random = Math.random): Updates {
  switch (room.phase) {
    case 'promptVote': {
      const listed = (room.promptOptions ?? []).map(String)
      const choice = pickMostVoted([...listed, CUSTOM_OPTION], roundPromptVotes(room), random)
      if (choice === CUSTOM_OPTION) {
        return { phase: 'questionWrite', lockingIn: null, phaseEndsAt: now + QUESTION_WRITE_MS }
      }
      // Nobody voted: pick one of the listed prompts.
      return answerListedPrompt(room, Number(choice ?? pickRandom(listed, random)), now)
    }
    case 'questionWrite': {
      const questions = Object.values(roundQuestions(room))
      if (questions.length === 0) {
        return answerListedPrompt(room, pickRandom(room.promptOptions ?? [0], random), now)
      }
      if (questions.length === 1) return beginAnswering(questions[0], now)
      return { phase: 'questionVote', lockingIn: null, phaseEndsAt: now + QUESTION_VOTE_MS }
    }
    case 'questionVote': {
      const questions = roundQuestions(room)
      const { winners } = tallyVotes(questions, roundQuestionVotes(room))
      const authorId = pickRandom(winners.length > 0 ? winners : Object.keys(questions), random)
      return beginAnswering(questions[authorId], now)
    }
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
        ? beginRound(room.round + 1, room, now, random)
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
