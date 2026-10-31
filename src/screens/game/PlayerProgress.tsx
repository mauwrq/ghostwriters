import { Ghost } from '../../components/Ghost'
import { sortedPlayers } from '../../game/room'
import type { Room } from '../../game/types'

// A row of ghosts that light up as each player finishes.
export function PlayerProgress({ room, doneIds, label }: { room: Room; doneIds: string[]; label: string }) {
  const players = sortedPlayers(room.players).filter(([, p]) => p.connected)

  return (
    <div className="progress">
      <div className="progress__ghosts">
        {players.map(([id, player]) => (
          <span key={id} className={doneIds.includes(id) ? 'progress__ghost progress__ghost--done' : 'progress__ghost'} title={player.name}>
            <Ghost look={player.look} size={28} />
          </span>
        ))}
      </div>
      <span className="label">{label}</span>
    </div>
  )
}
