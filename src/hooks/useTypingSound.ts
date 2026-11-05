import { useEffect } from 'react'
import { playBloop } from '../lib/sound'

// A bloop every other letter as text types out, like an RPG character talking.
// Every letter would be too fast to sound like speech.
export function useTypingSound(text: string, shown: number) {
  useEffect(() => {
    if (shown === 0 || shown >= text.length || shown % 2 !== 0) return
    if (/[\p{L}\p{N}]/u.test(text[shown - 1])) playBloop()
  }, [text, shown])
}
