import { describe, expect, it } from 'vitest'
import { gameStats, roundRecaps } from './credits'
import { GOODBYE_PROMPT, NAME_PROMPT, PROMPTS } from './prompts'
import type { Player, Room } from './types'

function player(joinedAt: number): Player {
  return { name: 'p', look: 0, score: 0, connected: true, joinedAt }
}

// A finished one-question game: name (1), "how did you die" (2), goodbye (3).
function finishedGame(overrides: Partial<Room> = {}): Room {
  return {
    hostId: 'a',
    createdAt: 0,
    phase: 'final',
    round: 3,
    totalRounds: 1,
    phaseEndsAt: null,
    prompt: '',
    gameStartedAt: 1,
    players: { a: player(1), b: player(2), c: player(3) },
    roundPrompts: { 1: NAME_PROMPT, 2: PROMPTS[0], 3: GOODBYE_PROMPT },
    answers: {
      1: { a: 'Queen Elinore the III', b: 'Greg', c: 'Bob' },
      2: { a: 'by tripping on a quill', b: 'of boredom.', c: 'twice' },
      3: { a: 'beware the cat!', b: 'run', c: 'nothing' },
    },
    votes: {
      1: { b: 'a', c: 'a', a: 'b' },
      2: { a: 'b', c: 'b', b: 'a' },
      3: { b: 'a', c: 'b', a: 'b' },
    },
    results: {
      1: { winners: ['a'], voteCounts: { a: 2, b: 1, c: 0 } },
      2: { winners: ['b'], voteCounts: { a: 1, b: 2, c: 0 } },
      3: { winners: ['b'], voteCounts: { a: 1, b: 2, c: 0 } },
    },
    ...overrides,
  }
}

describe('the round recaps', () => {
  it('lists each question with its winner, then the rest by votes', () => {
    const recaps = roundRecaps(finishedGame())
    expect(recaps.map((r) => r.question)).toEqual([NAME_PROMPT.question, PROMPTS[0].question, GOODBYE_PROMPT.question])
    expect(recaps[1].winners).toEqual([{ authorId: 'b', text: 'of boredom.', votes: 2 }])
    expect(recaps[1].others).toEqual([
      { authorId: 'a', text: 'by tripping on a quill', votes: 1 },
      { authorId: 'c', text: 'twice', votes: 0 },
    ])
  })

  it('shows every tied winner', () => {
    const room = finishedGame({
      results: {
        1: { winners: ['a', 'b'], voteCounts: { a: 1, b: 1, c: 0 } },
      },
    })
    expect(roundRecaps(room)[0].winners.map((a) => a.authorId).sort()).toEqual(['a', 'b'])
  })

  it('still lists the answers of a round with no winner', () => {
    const room = finishedGame({ results: { 2: { skipped: true } } })
    const [, second] = roundRecaps(room)
    expect(second.winners).toEqual([])
    expect(second.others).toHaveLength(3)
  })

  it('skips rounds that were never asked', () => {
    const room = finishedGame({ roundPrompts: { 1: NAME_PROMPT, 3: GOODBYE_PROMPT } })
    expect(roundRecaps(room).map((r) => r.round)).toEqual([1, 3])
  })
})

describe('game stats', () => {
  it('finds the top answer, crowd favorite, biggest fan, and who sided with the winner', () => {
    expect(gameStats(finishedGame())).toEqual({
      topAnswer: { authorId: 'a', text: 'Queen Elinore the III', votes: 2 },
      crowdFavorite: { playerId: 'b', votes: 5 },
      biggestFan: { fanId: 'a', idolId: 'b', times: 3 },
      withTheCrowd: { playerId: 'c', times: 3 },
    })
  })

  it('has nothing to report when nobody voted', () => {
    expect(gameStats(finishedGame({ votes: {}, results: {} }))).toEqual({
      topAnswer: null,
      crowdFavorite: null,
      biggestFan: null,
      withTheCrowd: null,
    })
  })
})
