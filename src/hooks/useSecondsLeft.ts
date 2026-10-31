import { useEffect, useState } from 'react'
import { serverNow } from '../lib/firebase'

// Seconds until endsAt, counted on the server's clock so every device shows
// the same countdown.
export function useSecondsLeft(endsAt: number | null | undefined): number | null {
  const [now, setNow] = useState(serverNow)

  useEffect(() => {
    if (!endsAt) return
    const id = setInterval(() => setNow(serverNow()), 250)
    return () => clearInterval(id)
  }, [endsAt])

  if (!endsAt) return null
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}
