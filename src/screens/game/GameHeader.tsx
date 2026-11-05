import { lastRound } from '../../game/logic'
import type { Room } from '../../game/types'
import { useSecondsLeft } from '../../hooks/useSecondsLeft'
import { text } from '../../text'

export function GameHeader({ room }: { room: Room }) {
  const secondsLeft = useSecondsLeft(room.phaseEndsAt)

  return (
    <header className="game-header">
      {/* The how-to-play screen comes before round 1. */}
      <span className="label label--ink">{room.round > 0 && text.round(room.round, lastRound(room))}</span>
      {secondsLeft !== null && <span className={secondsLeft <= 10 ? 'timer timer--low' : 'timer'}>{secondsLeft}</span>}
    </header>
  )
}
