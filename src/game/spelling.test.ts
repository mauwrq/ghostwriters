import { describe, expect, it } from 'vitest'
import { REST, SPOT_BY_KEY } from './board'
import {
  ANSWER_HOLD_MS,
  HOLD_MS,
  INTRO_MS,
  MOVE_MS,
  planchetteAt,
  PROMPT_CHAR_MS,
  PROMPT_FADE_MS,
  promptIntroMs,
  revealMs,
  spellMs,
  spellSteps,
  typedChars,
} from './spelling'

describe('spellSteps', () => {
  it('spells letters and digits, pausing on spaces', () => {
    expect(spellSteps('hi 2').map((s) => s.key)).toEqual(['H', 'I', null, '2'])
  })

  it('skips punctuation but reveals it with the letter before', () => {
    expect(spellSteps('no way!')).toEqual([
      { key: 'N', shown: 1 },
      { key: 'O', shown: 2 },
      { key: null, shown: 3 },
      { key: 'W', shown: 4 },
      { key: 'A', shown: 5 },
      { key: 'Y', shown: 7 },
    ])
  })

  it('goes straight to YES, NO and GOOD BYE', () => {
    expect(spellSteps('Yes!')).toEqual([{ key: 'YES', shown: 4 }])
    expect(spellSteps('no')).toEqual([{ key: 'NO', shown: 2 }])
    expect(spellSteps('good bye')).toEqual([{ key: 'GOODBYE', shown: 8 }])
    expect(spellSteps('Farewell.')).toEqual([{ key: 'GOODBYE', shown: 9 }])
  })

  it('strips accents and collapses extra spaces', () => {
    expect(spellSteps('é  e ').map((s) => s.key)).toEqual(['E', null, 'E'])
  })

  it('has no steps for text with nothing to spell', () => {
    expect(spellSteps('?!')).toEqual([])
  })

  it('only uses keys that exist on the board', () => {
    for (const step of spellSteps('The quick brown fox 0123456789')) {
      if (step.key) expect(SPOT_BY_KEY.has(step.key)).toBe(true)
    }
  })
})

describe('planchetteAt', () => {
  it('starts at rest', () => {
    expect(planchetteAt(['ab'], 0)).toMatchObject({ stage: 'spelling', ...REST, shown: 0 })
  })

  it('rests on each letter in turn', () => {
    const onA = planchetteAt(['ab'], INTRO_MS + MOVE_MS + 10)
    expect(onA).toMatchObject({ lit: 'A', shown: 1, x: SPOT_BY_KEY.get('A')!.x })
    const onB = planchetteAt(['ab'], INTRO_MS + 2 * MOVE_MS + HOLD_MS + 10)
    expect(onB).toMatchObject({ lit: 'B', shown: 2 })
  })

  it('pauses after each answer, then spells the next, then finishes', () => {
    const first = spellMs('a')
    expect(planchetteAt(['a', 'b'], first + 10)).toMatchObject({ index: 0, stage: 'pause' })
    expect(planchetteAt(['a', 'b'], first + ANSWER_HOLD_MS + 10)).toMatchObject({ index: 1, stage: 'spelling' })
    expect(planchetteAt(['a', 'b'], revealMs(['a', 'b']) + 10)).toMatchObject({ index: 1, stage: 'done' })
  })
})

describe('word timing', () => {
  it('holds longer on whole words', () => {
    expect(spellMs('yes')).toBeGreaterThan(spellMs('y'))
  })

  it('keeps the last letter lit during the pause', () => {
    expect(planchetteAt(['ab'], spellMs('ab') + 10)).toMatchObject({ stage: 'pause', lit: 'B' })
  })
})

describe('sliding', () => {
  it('moves in a straight line between spots', () => {
    const a = SPOT_BY_KEY.get('A')!
    const b = SPOT_BY_KEY.get('B')!
    const mid = planchetteAt(['ab'], INTRO_MS + MOVE_MS + HOLD_MS + MOVE_MS / 2)
    // Halfway through the A to B slide, it sits on the line between them.
    const cross = (b.x - a.x) * (mid.y - a.y) - (b.y - a.y) * (mid.x - a.x)
    expect(Math.abs(cross)).toBeLessThan(1e-6)
  })
})

describe('question intro', () => {
  it('types the question out after the board fades in', () => {
    expect(typedChars('Spirit?', 0)).toBe(0)
    expect(typedChars('Spirit?', PROMPT_FADE_MS + PROMPT_CHAR_MS * 3)).toBe(3)
    expect(typedChars('Spirit?', promptIntroMs('Spirit?'))).toBe(7)
  })
})
