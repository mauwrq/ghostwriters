import { Ghost } from '../../components/Ghost'
import { sortedPlayers } from '../../game/room'
import type { Room } from '../../game/types'

interface Props {
  room: Room
  // Points gained this round, shown next to the total.
  gained?: Record<string, number>
  highlight?: string[]
}

export function Scoreboard({ room, gained = {}, highlight = [] }: Props) {
  const players = [...sortedPlayers(room.players)].sort(([, a], [, b]) => b.score - a.score)

  return (
    <ol className="scoreboard">
      {players.map(([id, player]) => (
        <li key={id} className={highlight.includes(id) ? 'score score--highlight' : 'score'}>
          <Ghost look={player.look} size={28} />
          <span className="score__name">
            {player.name}
          </span>
          {gained[id] ? <span className="score__gained">+{gained[id]}</span> : null}
          <span className="score__total">{player.score}</span>
        </li>
      ))}
    </ol>
  )
}
