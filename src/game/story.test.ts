import { describe, expect, it } from 'vitest'
import { GOODBYE_PROMPT, NAME_PROMPT, NAMELESS_SPIRIT, PROMPTS } from './prompts'
import { buildStory, gameStats, spiritName, winningAnswer, type StorySentence } from './story'
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

const asText = (sentence: StorySentence) => sentence.map((p) => p.text).join('')

describe('the story', () => {
  it('names the spirit after the first winning answer', () => {
    expect(spiritName(finishedGame())).toBe('Queen Elinore the III')
    expect(winningAnswer(finishedGame(), 1)).toEqual({ authorId: 'a', text: 'Queen Elinore the III' })
  })

  it("fills each round's sentence with its winning answer", () => {
    expect(buildStory(finishedGame()).map(asText)).toEqual([
      'The group spoke with Queen Elinore the III.',
      'Queen Elinore the III died of boredom.',
      'By the end, Queen Elinore the III warned the players: run.',
    ])
  })

  it("marks the players' answers as blanks", () => {
    const [first] = buildStory(finishedGame())
    expect(first).toEqual([
      { text: 'The group spoke with ' },
      { text: 'Queen Elinore the III', blank: true },
      { text: '.' },
    ])
  })

  it('uses a generic sentence for questions the players wrote', () => {
    const room = finishedGame({
      roundPrompts: { 1: NAME_PROMPT, 2: { question: 'Spirit, who ate my fries?' }, 3: GOODBYE_PROMPT },
    })
    expect(asText(buildStory(room)[1])).toBe(
      'When asked "Spirit, who ate my fries", Queen Elinore the III said "of boredom".',
    )
  })

  it('skips rounds with no winner, and copes with no name', () => {
    const room = finishedGame({ results: { 2: { skipped: true }, 3: { winners: ['a'], voteCounts: { a: 1 } } } })
    expect(buildStory(room).map(asText)).toEqual([
      'The group spoke with ' + NAMELESS_SPIRIT + '.',
      'By the end, ' + NAMELESS_SPIRIT + ' warned the players: beware the cat.',
    ])
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
