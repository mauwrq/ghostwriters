import { useEffect, useState } from 'react'

// How long the old screen takes to fade out before the new one fades in.
export const FADE_OUT_MS = 800

// Holds on to the screen that's showing for a moment after the phase changes,
// so it can fade out before the next one fades in. While it fades out it keeps
// the value it last had, so it doesn't flash the next phase's data.
export function usePhaseFade<T>(key: string, value: T): { shownKey: string; shownValue: T; leaving: boolean } {
  const [shown, setShown] = useState({ key, value })

  // Keep the snapshot current while this screen is the one showing.
  if (key === shown.key && value !== shown.value) setShown({ key, value })

  useEffect(() => {
    if (key === shown.key) return
    const timer = setTimeout(() => setShown((s) => ({ ...s, key })), FADE_OUT_MS)
    return () => clearTimeout(timer)
  }, [key, shown.key])

  return { shownKey: shown.key, shownValue: shown.value, leaving: key !== shown.key }
}
