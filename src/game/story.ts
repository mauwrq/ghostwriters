// The end-of-game credits: the story the winning answers tell, and a few
// stats about how everyone voted. Pure functions of the room.
import { answerOrder, lastRound } from './logic'
import { sortedPlayers } from './room'
import { CUSTOM_STORY, NAME_PROMPT, NAMELESS_SPIRIT } from './prompts'
import type { Room } from './types'

export interface Winner {
  authorId: string
  text: string
}

// A round's winning answer. With a tie, the one spelled first wins the story.
export function winningAnswer(room: Room, round: number): Winner | null {
  const winners = room.results?.[round]?.winners ?? []
  const hit = answerOrder(room, round).find(([id]) => winners.includes(id))
  return hit ? { authorId: hit[0], text: hit[1] } : null
}

// A piece of the story. Blanks are the parts filled in by players' answers.
export interface StoryPart {
  text: string
  blank?: boolean
}

export type StorySentence = StoryPart[]

// Answers go mid-sentence, so trailing punctuation would double up.
function tidy(answer: string): string {
  return answer.trim().replace(/[.!?]+$/, '')
}

function fill(template: string, values: Record<string, string>): StorySentence {
  const parts: StorySentence = []
  let last = 0
  for (const match of template.matchAll(/\{(\w+)\}/g)) {
    if (match.index > last) parts.push({ text: template.slice(last, match.index) })
    const value = values[match[1]] ?? ''
    // The question itself isn't a player's blank, just part of the sentence.
    parts.push(match[1] === 'question' ? { text: value } : { text: value, blank: true })
    last = match.index + match[0].length
  }
  if (last < template.length) parts.push({ text: template.slice(last) })
  return parts
}

export function spiritName(room: Room): string {
  const name = winningAnswer(room, 1)
  return name ? tidy(name.text) : NAMELESS_SPIRIT
}

// One sentence per round that had a winning answer, starting with the name.
export function buildStory(room: Room): StorySentence[] {
  const spirit = spiritName(room)
  const sentences: StorySentence[] = [fill(room.roundPrompts?.[1]?.story ?? NAME_PROMPT.story, { spirit })]
  for (let round = 2; round <= lastRound(room); round++) {
    const winner = winningAnswer(room, round)
    const prompt = room.roundPrompts?.[round]
    if (!winner || !prompt) continue
    sentences.push(
      fill(prompt.story ?? CUSTOM_STORY, { spirit, answer: tidy(winner.text), question: tidy(prompt.question) }),
    )
  }
  return sentences
}

export interface GameStats {
  // The single answer that got the most votes in its round.
  topAnswer: (Winner & { votes: number }) | null
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
