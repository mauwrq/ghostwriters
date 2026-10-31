interface Props {
  color: string
  size?: number
  className?: string
}

// Player avatar. color is a CSS color, usually one of PLAYER_COLORS.
export function Ghost({ color, size = 40, className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 44"
      width={size}
      height={size * 1.1}
      aria-hidden="true"
    >
      <path
        d="M4 20C4 10.6 11.2 3 20 3s16 7.6 16 17v20l-5-4-5 4-6-4-6 4-5-4-5 4z"
        style={{ fill: color }}
        stroke="var(--color-outline)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse cx="14.5" cy="19" rx="3" ry="4" fill="var(--color-outline)" />
      <ellipse cx="25.5" cy="19" rx="3" ry="4" fill="var(--color-outline)" />
    </svg>
  )
}
