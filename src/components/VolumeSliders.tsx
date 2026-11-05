import { useState, type ReactNode } from 'react'
import type { VolumeKind } from '../lib/identity'
import { getVolume, playBloop, setVolume } from '../lib/sound'
import { text } from '../text'
import './VolumeSliders.css'

// Two small icons in the corner of every page. Hovering, tapping or tabbing to
// one raises its slider. The middle of the slider is the game's normal level,
// so players can go louder as well as quieter. Remembered per device.
export function VolumeSliders() {
  return (
    <div className="volume">
      <VolumeSlider kind="music" label={text.music}>
        <path d="M9 18V5l11-2v13" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="17.5" cy="16" r="2.5" />
      </VolumeSlider>
      <VolumeSlider kind="sfx" label={text.sfx}>
        <path d="M8 8V3h8v5" />
        <path d="M2 6.5v3M3 8h18M22 6.5v3" />
        <path d="M5 8 3 21h18L19 8" />
        <path d="M8 12h.01M12 12h.01M16 12h.01M7 15h.01M11 15h.01M13 15h.01M17 15h.01M9 18h6" />
      </VolumeSlider>
    </div>
  )
}

interface Props {
  kind: VolumeKind
  label: string
  children: ReactNode // The icon's shapes.
}

function VolumeSlider({ kind, label, children }: Props) {
  const [value, setValue] = useState(() => getVolume(kind))

  return (
    <label className="volume__slider">
      <input
        type="range"
        aria-label={label}
        min={0}
        max={2}
        step={0.05}
        value={value}
        onChange={(e) => {
          setValue(e.target.valueAsNumber)
          setVolume(kind, e.target.valueAsNumber)
        }}
        // Effects don't play on their own, so give a taste of the new level.
        onPointerUp={() => kind === 'sfx' && playBloop()}
      />
      <svg className="volume__icon" viewBox="0 0 24 24" aria-hidden="true">
        {children}
      </svg>
    </label>
  )
}
