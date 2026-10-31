import { describe, expect, it } from 'vitest'
import {
  ANSWER_MS,
  backToLobby,
  finalWinners,
  isPhaseComplete,
  nextPhase,
  pickPromptIndex,
  roundPoints,
  seededShuffle,
  startGame,
  tallyVotes,
  VOTE_MS,
} from './logic'
import { PROMPTS } from './prompts'
import { PLAYER_COLORS } from './room'
import type { Player, Room } from './types'

function player(overrides: Partial<Player> = {}): Player {
  return { name: 'p', color: PLAYER_COLORS[0], score: 0, connected: true, joinedAt: 0, ...overrides }
}

function room(overrides: Partial<Room> = {}): Room {
  return {
    hostId: 'a',
    createdAt: 0,
    phase: 'answering',
    round: 1,
    totalRounds: 2,
    phaseEndsAt: 0,
    prompt: '',
    players: { a: player({ joinedAt: 1 }), b: player({ joinedAt: 2 }), c: player({ joinedAt: 3 }) },
    ...overrides,
  }
}

describe('tallyVotes', () => {
  it('counts votes and finds the winner', () => {
    const result = tallyVotes({ a: 'x', b: 'y', c: 'z' }, { a: 'b', b: 'c', c: 'b' })
    expect(result.voteCounts).toEqual({ a: 0, b: 2, c: 1 })
    expect(result.winners).toEqual(['b'])
  })

  it('ignores self votes and votes for non-answers', () => {
    const result = tallyVotes({ a: 'x', b: 'y' }, { a: 'a', b: 'nobody', c: 'b' })
    expect(result.voteCounts).toEqual({ a: 0, b: 1 })
  })

  it('returns every tied winner', () => {
    expect(tallyVotes({ a: 'x', b: 'y' }, { a: 'b', b: 'a' }).winners).toEqual(['a', 'b'])
  })

  it('has no winner when nobody voted', () => {
    expect(tallyVotes({ a: 'x', b: 'y' }, {}).winners).toEqual([])
  })
})

describe('roundPoints', () => {
  it('gives 100 per vote plus 200 to winners', () => {
    expect(roundPoints({ winners: ['b'], voteCounts: { a: 1, b: 2, c: 0 } })).toEqual({ a: 100, b: 400 })
  })
})

describe('pickPromptIndex', () => {
  it('never repeats while unused prompts remain', () => {
    expect(pickPromptIndex(3, [0, 2], () => 0.99)).toBe(1)
  })

  it('starts over once every prompt was used', () => {
    expect(pickPromptIndex(2, [0, 1], () => 0)).toBe(0)
  })
})

describe('seededShuffle', () => {
  it('gives the same order for the same seed', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    expect(seededShuffle(items, 'ABCD:1')).toEqual(seededShuffle(items, 'ABCD:1'))
    expect([...seededShuffle(items, 'ABCD:1')].sort()).toEqual(items)
  })
})

describe('isPhaseComplete', () => {
  it('waits for every connected player to answer', () => {
    expect(isPhaseComplete(room({ answers: { 1: { a: 'x', b: 'y' } } }))).toBe(false)
    expect(isPhaseComplete(room({ answers: { 1: { a: 'x', b: 'y', c: 'z' } } }))).toBe(true)
  })

  it("doesn't wait for disconnected players", () => {
    const players = { a: player(), b: player(), c: player({ connected: false }) }
    expect(isPhaseComplete(room({ players, answers: { 1: { a: 'x', b: 'y' } } }))).toBe(true)
  })
})

describe('game flow', () => {
  it('starts round 1 with a prompt and resets scores', () => {
    const updates = startGame(room({ phase: 'lobby', round: 0 }), 1000, () => 0)
    expect(updates).toMatchObject({ phase: 'answering', round: 1, prompt: PROMPTS[0], phaseEndsAt: 1000 + ANSWER_MS })
    expect(updates['players/a/score']).toBe(0)
  })

  it('moves to voting when enough people answered', () => {
    const updates = nextPhase(room({ answers: { 1: { a: 'x', b: 'y' } } }), 1000)
    expect(updates).toEqual({ phase: 'voting', phaseEndsAt: 1000 + VOTE_MS })
  })

  it('skips voting with fewer than 2 answers', () => {
    const updates = nextPhase(room({ answers: { 1: { a: 'x' } } }), 1000)
    expect(updates.phase).toBe('reveal')
    expect(updates['results/1']).toEqual({ skipped: true })
  })

  it('tallies votes and adds to scores', () => {
    const r = room({
      phase: 'voting',
      players: { a: player({ score: 50 }), b: player(), c: player() },
      answers: { 1: { a: 'x', b: 'y' } },
      votes: { 1: { b: 'a', c: 'a', a: 'b' } },
    })
    const updates = nextPhase(r, 0)
    expect(updates.phase).toBe('reveal')
    expect(updates['players/a/score']).toBe(50 + 200 + 200)
    expect(updates['players/b/score']).toBe(100)
  })

  it('goes to the next round, then to final', () => {
    expect(nextPhase(room({ phase: 'scores', round: 1, usedPrompts: [0] }), 0, () => 0)).toMatchObject({
      phase: 'answering',
      round: 2,
      usedPrompts: [0, 1],
    })
    expect(nextPhase(room({ phase: 'scores', round: 2 }), 0)).toEqual({ phase: 'final', phaseEndsAt: null })
  })

  it('returns to the lobby with scores cleared', () => {
    const updates = backToLobby(room({ phase: 'final', players: { a: player({ score: 900 }) } }))
    expect(updates).toMatchObject({ phase: 'lobby', round: 0, answers: null, 'players/a/score': 0 })
  })

  it('finds the final winners', () => {
    const players = { a: player({ score: 300 }), b: player({ score: 500 }), c: player({ score: 500 }) }
    expect(finalWinners(room({ players }))).toEqual(['b', 'c'])
  })
})
