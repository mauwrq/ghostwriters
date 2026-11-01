import { planchetteAt, revealMs, type PlanchetteState } from '../game/spelling'
import { useClock } from './useClock'

// Plays the spelling of texts, starting at startAt (server time). Since the
// position is computed from the clock, everyone sees the same moment, and a
// player who refreshes picks up mid-word.
export function usePlanchette(texts: string[], startAt: number): PlanchetteState {
  const now = useClock(startAt + revealMs(texts))
  return planchetteAt(texts, now - startAt)
}
