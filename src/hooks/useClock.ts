import { useEffect, useState } from 'react'
import { serverNow } from '../lib/firebase'

// The server's time, updated every animation frame until endAt. Animations
// computed from it look the same on every device.
export function useClock(endAt: number): number {
  const [now, setNow] = useState(serverNow)

  useEffect(() => {
    let frame = 0
    const tick = () => {
      const t = serverNow()
      setNow(t)
      if (t < endAt) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [endAt])

  return now
}
