import { useEffect, useState } from 'react'
import { planchetteAt, revealMs, type PlanchetteState } from '../game/spelling'
import { serverNow } from '../lib/firebase'

// Plays the spelling of texts, starting at startAt (server time). Since the
// position is computed from the clock, everyone sees the same moment, and a
// player who refreshes picks up mid-word.
export function usePlanchette(texts: string[], startAt: number): PlanchetteState {
  const key = texts.join('\n')
  const [now, setNow] = useState(serverNow)

  useEffect(() => {
    const end = startAt + revealMs(key.split('\n'))
    let frame = 0
    const tick = () => {
      const t = serverNow()
      setNow(t)
      if (t < end) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [key, startAt])

  return planchetteAt(texts, now - startAt)
}
