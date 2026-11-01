import { describe, expect, it } from 'vitest'
import {
  answerOrder,
  ANSWER_MS,
  backToLobby,
  CUSTOM_OPTION,
  hasLockIn,
  lockIn,
  LOCK_IN_MS,
  pickMostVoted,
  pickPromptOptions,
  PROMPT_VOTE_MS,
  RESULTS_MS,
  seancePhaseMs,
  QUESTION_WRITE_MS,
  finalWinners,
  isPhaseComplete,
  nextPhase,
  roundPoints,
  seededShuffle,
  startGame,
  tallyVotes,
  VOTE_MS,
} from './logic'
import { PROMPTS } from './prompts'
import type { Player, Room } from './types'

function player(overrides: Partial<Player> = {}): Player {
  return { name: 'p', look: 0, score: 0, connected: true, joinedAt: 0, ...overrides }
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

describe('pickPromptOptions', () => {
  it('prefers unused prompts', () => {
    expect(pickPromptOptions(5, [0, 1], 3).sort()).toEqual([2, 3, 4])
  })

  it('tops up with used prompts when few are left', () => {
    const options = pickPromptOptions(4, [0, 1, 2], 3)
    expect(options).toHaveLength(3)
    expect(options).toContain(3)
  })
})

describe('pickMostVoted', () => {
  it('picks the most voted option', () => {
    expect(pickMostVoted(['0', '1', CUSTOM_OPTION], { a: '1', b: '1', c: CUSTOM_OPTION })).toBe('1')
  })

  it('breaks ties at random', () => {
    expect(pickMostVoted(['0', '1'], { a: '0', b: '1' }, () => 0.99)).toBe('1')
  })

  it('returns null with no votes', () => {
    expect(pickMostVoted(['0', '1'], {})).toBeNull()
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
  it('starts round 1 with a question vote and resets scores', () => {
    const updates = startGame(room({ phase: 'lobby', round: 0, usedPrompts: [0, 1] }), 1000)
    expect(updates).toMatchObject({ phase: 'promptVote', round: 1, phaseEndsAt: 1000 + PROMPT_VOTE_MS })
    expect(updates.promptOptions).toHaveLength(3)
    expect(updates['players/a/score']).toBe(0)
  })

  it('uses the voted prompt', () => {
    const r = room({ phase: 'promptVote', promptOptions: [0, 2, 3], promptVotes: { 1: { a: '2', b: '2', c: '0' } } })
    expect(nextPhase(r, 1000)).toEqual({
      phase: 'answering',
      prompt: PROMPTS[2],
      usedPrompts: [2],
      lockingIn: null,
      phaseEndsAt: 1000 + ANSWER_MS,
    })
  })

  it('goes to question writing when the custom option wins', () => {
    const r = room({ phase: 'promptVote', promptOptions: [0, 1, 2], promptVotes: { 1: { a: CUSTOM_OPTION, b: CUSTOM_OPTION } } })
    expect(nextPhase(r, 1000)).toEqual({ phase: 'questionWrite', lockingIn: null, phaseEndsAt: 1000 + QUESTION_WRITE_MS })
  })

  it('picks a listed prompt when nobody voted', () => {
    const r = room({ phase: 'promptVote', promptOptions: [1, 2, 3] })
    expect([PROMPTS[1], PROMPTS[2], PROMPTS[3]]).toContain(nextPhase(r, 0).prompt)
  })

  it('uses a single written question directly', () => {
    const r = room({ phase: 'questionWrite', questions: { 1: { a: 'Spirit, who stole my fries?' } } })
    expect(nextPhase(r, 0)).toMatchObject({ phase: 'answering', prompt: 'Spirit, who stole my fries?' })
  })

  it('votes on questions when several were written', () => {
    const r = room({ phase: 'questionWrite', questions: { 1: { a: 'q1', b: 'q2' } } })
    expect(nextPhase(r, 0).phase).toBe('questionVote')
  })

  it('falls back to a listed prompt when nobody wrote a question', () => {
    const r = room({ phase: 'questionWrite', promptOptions: [3] })
    expect(nextPhase(r, 0)).toMatchObject({ phase: 'answering', prompt: PROMPTS[3], usedPrompts: [3] })
  })

  it('asks the most voted written question, ignoring self votes', () => {
    const r = room({
      phase: 'questionVote',
      questions: { 1: { a: 'q1', b: 'q2' } },
      questionVotes: { 1: { a: 'a', c: 'b' } },
    })
    expect(nextPhase(r, 0).prompt).toBe('q2')
  })

  it('locks in question votes with a short countdown', () => {
    expect(hasLockIn('promptVote')).toBe(true)
    expect(hasLockIn('voting')).toBe(false)
    expect(lockIn(room({ phaseEndsAt: 50_000 }), 10_000)).toEqual({ lockingIn: true, phaseEndsAt: 10_000 + LOCK_IN_MS })
    expect(lockIn(room({ phaseEndsAt: 11_000 }), 10_000).phaseEndsAt).toBe(11_000)
  })

  it('holds a séance to spell out the answers when enough people answered', () => {
    const r = room({ prompt: 'Spirit?', answers: { 1: { a: 'x', b: 'y' } } })
    const texts = answerOrder(r).map(([, answer]) => answer)
    expect(nextPhase(r, 1000)).toEqual({ phase: 'seance', phaseEndsAt: 1000 + seancePhaseMs('Spirit?', texts) })
  })

  it('spells every answer, in the same order the vote lists them', () => {
    const r = room({ gameStartedAt: 5, answers: { 1: { a: 'one', b: 'two', c: 'three' } } })
    expect(answerOrder(r).map(([, answer]) => answer).sort()).toEqual(['one', 'three', 'two'])
    expect(answerOrder(r)).toEqual(answerOrder({ ...r }))
  })

  it('moves to voting after the séance', () => {
    expect(nextPhase(room({ phase: 'seance' }), 1000)).toEqual({ phase: 'voting', phaseEndsAt: 1000 + VOTE_MS })
  })

  it('skips the séance and voting with fewer than 2 answers', () => {
    const updates = nextPhase(room({ answers: { 1: { a: 'x' } } }), 1000)
    expect(updates.phase).toBe('reveal')
    expect(updates.phaseEndsAt).toBe(1000 + RESULTS_MS)
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
    const next = nextPhase(room({ phase: 'scores', round: 1, usedPrompts: [0] }), 0)
    expect(next).toMatchObject({ phase: 'promptVote', round: 2 })
    expect(next.promptOptions).not.toContain(0)
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
