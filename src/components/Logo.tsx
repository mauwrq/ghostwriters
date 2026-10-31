import { PLAYER_COLORS } from '../game/room'
import { text } from '../text'

// The title with each letter in a different player color.
export function Logo({ small = false }: { small?: boolean }) {
  return (
    <h1 className={small ? 'logo logo--small' : 'logo'} aria-label={text.title}>
      {[...text.title].map((letter, i) => (
        <span key={i} aria-hidden="true" style={{ color: PLAYER_COLORS[i % PLAYER_COLORS.length] }}>
          {letter}
        </span>
      ))}
    </h1>
  )
}
