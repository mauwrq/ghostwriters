import type { Room } from '../../game/types'
import { useSecondsLeft } from '../../hooks/useSecondsLeft'
import { text } from '../../text'

export function GameHeader({ room }: { room: Room }) {
  const secondsLeft = useSecondsLeft(room.phaseEndsAt)

  return (
    <header className="game-header">
      <span className="label label--ink">{text.round(room.round, room.totalRounds)}</span>
      {secondsLeft !== null && <span className={secondsLeft <= 10 ? 'timer timer--low' : 'timer'}>{secondsLeft}</span>}
    </header>
  )
}
