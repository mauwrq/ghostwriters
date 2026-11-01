import { answerOrder, seancePhaseMs } from '../game/logic'
import { planchetteAt, promptIntroMs, typedChars, type PlanchetteState } from '../game/spelling'
import type { Room } from '../game/types'
import { useClock } from './useClock'

export interface SeanceState {
  // Every answer, in the order the board spells them.
  texts: string[]
  // How much of the question has typed itself out under the board.
  promptShown: number
  planchette: PlanchetteState
  // True once the question has finished and the spelling has begun.
  spelling: boolean
}

// The séance's timeline: the question types out, then the planchette spells
// each answer in turn. Worked out from when the host scheduled the phase to
// end, so every device shows the same moment.
export function useSeance(room: Room): SeanceState {
  const texts = answerOrder(room).map(([, answer]) => answer)
  const endAt = room.phaseEndsAt ?? 0
  const startAt = endAt - seancePhaseMs(room.prompt, texts)
  const spellingAt = startAt + promptIntroMs(room.prompt)
  const now = useClock(endAt)

  return {
    texts,
    promptShown: typedChars(room.prompt, now - startAt),
    planchette: planchetteAt(texts, now - spellingAt),
    spelling: now >= spellingAt,
  }
}
