// Turns answers into planchette moves, and says where the planchette is at
// any moment. Everything is a pure function of time, so every device can
// compute the same animation from the same start time and stay in sync.
import { REST, SPOT_BY_KEY } from './board'

export const INTRO_MS = 900 // planchette waits in the middle before starting
export const MOVE_MS = 420 // gliding from one spot to the next
export const HOLD_MS = 280 // resting on a letter
export const WORD_HOLD_MS = 1400 // resting on YES, NO or GOOD BYE
export const PAUSE_MS = 250 // extra rest in the middle for a space
export const AUTHOR_MS = 3200 // showing who wrote it, after spelling

export interface Step {
  // A board key, or null to slide back to the middle (a space).
  key: string | null
  // How many characters of the answer are revealed once this step lands.
  shown: number
}

// Answers that are just one of these go straight to that spot on the board.
const WORDS: Record<string, string> = { YES: 'YES', NO: 'NO', GOODBYE: 'GOODBYE', FAREWELL: 'GOODBYE' }

// Board keys only have plain letters, so "é" becomes "E".
function boardKey(char: string): string | null {
  const key = char.normalize('NFD')[0].toUpperCase()
  return /^[A-Z0-9]$/.test(key) ? key : null
}

export function spellSteps(text: string): Step[] {
  // "yes", "No!", "farewell" go straight to the word on the board.
  const lettersOnly = text.toUpperCase().replace(/[^A-Z]/g, '')
  if (lettersOnly in WORDS && !/\d/.test(text)) {
    return [{ key: WORDS[lettersOnly], shown: text.length }]
  }

  const steps: Step[] = []
  ;[...text].forEach((char, i) => {
    const key = boardKey(char)
    if (key) {
      steps.push({ key, shown: i + 1 })
    } else if (/\s/.test(char)) {
      if (steps.length > 0 && steps[steps.length - 1].key !== null) steps.push({ key: null, shown: i + 1 })
    } else if (steps.length > 0) {
      // Punctuation isn't on the board; it appears along with the letter before it.
      steps[steps.length - 1].shown = i + 1
    }
  })
  while (steps.length > 0 && steps[steps.length - 1].key === null) steps.pop()
  if (steps.length > 0) steps[steps.length - 1].shown = text.length
  return steps
}

function stepMs(step: Step): number {
  if (step.key === null) return MOVE_MS + PAUSE_MS
  return MOVE_MS + (step.key.length > 1 ? WORD_HOLD_MS : HOLD_MS)
}

export function spellMs(text: string): number {
  return INTRO_MS + spellSteps(text).reduce((sum, step) => sum + stepMs(step), 0)
}

// Total time to spell every answer in turn, each followed by its author.
export function revealMs(texts: string[]): number {
  return texts.reduce((sum, text) => sum + spellMs(text) + AUTHOR_MS, 0)
}

export interface PlanchetteState {
  // Which answer is being revealed (they're spelled one after another).
  index: number
  stage: 'spelling' | 'author' | 'done'
  x: number
  y: number
  // How many characters of the current answer to show.
  shown: number
  // The key the planchette is resting on, if any.
  lit: string | null
}

function spotFor(key: string | null): { x: number; y: number } {
  return (key && SPOT_BY_KEY.get(key)) || REST
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

export function planchetteAt(texts: string[], elapsed: number): PlanchetteState {
  let t = Math.max(0, elapsed)
  let last = REST

  for (let index = 0; index < texts.length; index++) {
    const text = texts[index]
    const steps = spellSteps(text)
    const spelling = spellMs(text)

    if (t < spelling) {
      if (t < INTRO_MS) return { index, stage: 'spelling', ...last, shown: 0, lit: null }
      t -= INTRO_MS
      let from = last
      let shown = 0
      for (const step of steps) {
        const to = spotFor(step.key)
        const duration = stepMs(step)
        if (t < MOVE_MS) {
          // A straight slide from one spot to the next.
          const p = easeInOut(t / MOVE_MS)
          return {
            index,
            stage: 'spelling',
            x: from.x + (to.x - from.x) * p,
            y: from.y + (to.y - from.y) * p,
            shown,
            lit: null,
          }
        }
        if (t < duration) {
          return { index, stage: 'spelling', ...to, shown: step.shown, lit: step.key }
        }
        t -= duration
        from = to
        shown = step.shown
      }
      return { index, stage: 'spelling', ...from, shown: text.length, lit: null }
    }
    t -= spelling
    const lastKey = steps.length > 0 ? steps[steps.length - 1].key : null
    last = lastKey ? spotFor(lastKey) : last

    // The planchette stays on the last letter while the author is shown.
    if (t < AUTHOR_MS) return { index, stage: 'author', ...last, shown: text.length, lit: lastKey }
    t -= AUTHOR_MS
  }

  const index = Math.max(0, texts.length - 1)
  return { index, stage: 'done', ...last, shown: texts[index]?.length ?? 0, lit: null }
}
