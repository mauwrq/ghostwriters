// The end-of-game credits: what was asked and answered each round, and a few
// stats about how everyone voted. Pure functions of the room.
import { answerOrder, lastRound } from './logic'
import { sortedPlayers } from './room'
import type { Room } from './types'

export interface Winner {
  authorId: string
  text: string
}

export interface RankedAnswer extends Winner {
  votes: number
}

export interface RoundRecap {
  round: number
  question: string
  // The answers the group voted in. More than one if they tied.
  winners: RankedAnswer[]
  // Everyone else's answers, most votes first.
  others: RankedAnswer[]
}

// One entry per question asked, in the order they were asked.
export function roundRecaps(room: Room): RoundRecap[] {
  const recaps: RoundRecap[] = []
  for (let round = 1; round <= lastRound(room); round++) {
    const question = room.roundPrompts?.[round]?.question
    if (!question) continue
    const result = room.results?.[round]
    const winners = result?.winners ?? []
    const ranked = answerOrder(room, round)
      .map(([authorId, text]) => ({ authorId, text, votes: result?.voteCounts?.[authorId] ?? 0 }))
      .sort((a, b) => b.votes - a.votes)
    recaps.push({
      round,
      question,
      winners: ranked.filter((answer) => winners.includes(answer.authorId)),
      others: ranked.filter((answer) => !winners.includes(answer.authorId)),
    })
  }
  return recaps
}

export interface GameStats {
  // The single answer that got the most votes in its round.
  topAnswer: RankedAnswer | null
  // The player whose answers got the most votes over the whole game.
  crowdFavorite: { playerId: string; votes: number } | null
  // The player who voted for the same person most often (at least twice).
  biggestFan: { fanId: string; idolId: string; times: number } | null
  // The player who most often voted for the answer that went on to win.
  withTheCrowd: { playerId: string; times: number } | null
}

// Highest count wins; ties go to whoever joined first, so it's stable.
function top(counts: Map<string, number>, order: string[]): [string, number] | null {
  let best: [string, number] | null = null
  for (const id of order) {
    const count = counts.get(id) ?? 0
    if (count > 0 && (!best || count > best[1])) best = [id, count]
  }
  return best
}

export function gameStats(room: Room): GameStats {
  const order = sortedPlayers(room.players).map(([id]) => id)
  const votesReceived = new Map<string, number>()
  const sidedWithWinner = new Map<string, number>()
  const fanCounts = new Map<string, Map<string, number>>()
  let topAnswer: GameStats['topAnswer'] = null

  for (let round = 1; round <= lastRound(room); round++) {
    const result = room.results?.[round]
    const answers = room.answers?.[round] ?? {}
    for (const [id, count] of Object.entries(result?.voteCounts ?? {})) {
      votesReceived.set(id, (votesReceived.get(id) ?? 0) + count)
      if (count > 0 && (!topAnswer || count > topAnswer.votes) && answers[id]) {
        topAnswer = { authorId: id, text: answers[id], votes: count }
      }
    }
    for (const [voter, target] of Object.entries(room.votes?.[round] ?? {})) {
      if (voter === target) continue
      if (result?.winners?.includes(target)) sidedWithWinner.set(voter, (sidedWithWinner.get(voter) ?? 0) + 1)
      const idols = fanCounts.get(voter) ?? new Map<string, number>()
      idols.set(target, (idols.get(target) ?? 0) + 1)
      fanCounts.set(voter, idols)
    }
  }

  let biggestFan: GameStats['biggestFan'] = null
  for (const fanId of order) {
    const best = top(fanCounts.get(fanId) ?? new Map(), order)
    if (best && best[1] >= 2 && (!biggestFan || best[1] > biggestFan.times)) {
      biggestFan = { fanId, idolId: best[0], times: best[1] }
    }
  }

  const favorite = top(votesReceived, order)
  const crowd = top(sidedWithWinner, order)
  return {
    topAnswer,
    crowdFavorite: favorite && { playerId: favorite[0], votes: favorite[1] },
    biggestFan,
    withTheCrowd: crowd && { playerId: crowd[0], times: crowd[1] },
  }
}
