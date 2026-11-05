import { useEffect } from 'react'
import { playSlide } from '../lib/sound'

// Plays the planchette's slide sound as each slide begins. slide is the length
// of the current slide, and goes back to nothing while the planchette rests.
export function useSlideSound(slide: number | undefined) {
  useEffect(() => {
    if (slide) playSlide(slide)
  }, [slide])
}
