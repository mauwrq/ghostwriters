import { useId, type ReactNode } from 'react'

interface Props {
  look: number
  size?: number
  className?: string
}

const BODY = 'M4 20C4 10.6 11.2 3 20 3s16 7.6 16 17v20l-5-4-5 4-6-4-6 4-5-4-5 4z'
const INK = 'var(--ink)'
const BG = 'var(--bg)'

// Player avatar. The game is black and white, so each player's look is a
// different doodle pattern inside the ghost instead of a color.
export function Ghost({ look, size = 40, className }: Props) {
  // Pattern IDs must be unique per ghost on the page and safe inside url().
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const solid = look === 1

  return (
    <svg
      className={className ? `ghost ${className}` : 'ghost'}
      viewBox="0 0 40 44"
      width={size}
      height={size * 1.1}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`${id}-body`}>
          <path d={BODY} />
        </clipPath>
        {patternFor(look, `${id}-fill`)}
      </defs>
      <path d={BODY} fill={BG} />
      <g clipPath={`url(#${id}-body)`}>{fillFor(look, `${id}-fill`)}</g>
      <path d={BODY} fill="none" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {[14.5, 25.5].map((cx) => (
        <ellipse
          key={cx}
          cx={cx}
          cy="19"
          rx="3"
          ry="4"
          fill={solid ? BG : INK}
          stroke={solid ? INK : BG}
          strokeWidth="1.5"
          paintOrder="stroke"
        />
      ))}
    </svg>
  )
}

function patternFor(look: number, id: string): ReactNode {
  const common = { id, patternUnits: 'userSpaceOnUse' as const }
  switch (look) {
    case 2: // horizontal stripes
      return (
        <pattern {...common} width="40" height="6">
          <rect y="1" width="40" height="2.5" fill={INK} />
        </pattern>
      )
    case 3: // dots
      return (
        <pattern {...common} width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.6" fill={INK} />
        </pattern>
      )
    case 4: // vertical stripes
      return (
        <pattern {...common} width="6" height="44">
          <rect x="1" width="2.5" height="44" fill={INK} />
        </pattern>
      )
    case 5: // checks
      return (
        <pattern {...common} width="8" height="8">
          <rect width="4" height="4" fill={INK} />
          <rect x="4" y="4" width="4" height="4" fill={INK} />
        </pattern>
      )
    case 6: // diagonal hatching
      return (
        <pattern {...common} width="5" height="5" patternTransform="rotate(45)">
          <rect width="1.8" height="5" fill={INK} />
        </pattern>
      )
    default:
      return null
  }
}

function fillFor(look: number, patternId: string): ReactNode {
  switch (look) {
    case 0: // plain
      return null
    case 1: // solid
      return <rect width="40" height="44" fill={INK} />
    case 7: // dipped in ink
      return <path d="M0 27 Q10 24 20 27 T40 27 V44 H0Z" fill={INK} />
    default:
      return <rect width="40" height="44" fill={`url(#${patternId})`} />
  }
}
