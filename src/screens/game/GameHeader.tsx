import type { Room } from '../../game/types'
import { useSecondsLeft } from '../../hooks/useSecondsLeft'
import { text } from '../../text'

export function GameHeader({ room }: { room: Room }) {
  const secondsLeft = useSecondsLeft(room.phaseEndsAt)
  const showPrompt = room.phase === 'answering' || room.phase === 'voting' || room.phase === 'reveal'

  return (
    <header className="panel game-header">
      <div className="game-header__bar">
        <span className="label">{text.round(room.round, room.totalRounds)}</span>
        {secondsLeft !== null && (
          <span className={secondsLeft <= 10 ? 'timer timer--low' : 'timer'}>{secondsLeft}</span>
        )}
      </div>
      {showPrompt && <h2 className="game-header__prompt">{room.prompt}</h2>}
    </header>
  )
}
