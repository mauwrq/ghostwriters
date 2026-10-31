import { Ghost } from '../../components/Ghost'
import { roundAnswers, roundResult } from '../../game/logic'
import type { Room } from '../../game/types'
import { text } from '../../text'

// Placeholder reveal: shows the winning answer as text. The Ouija board's
// planchette will spell it out here later.
export function Reveal({ room }: { room: Room }) {
  const answers = roundAnswers(room)
  const result = roundResult(room)
  const winners = result.winners ?? []
  const voteCounts = result.voteCounts ?? {}
  const others = Object.entries(answers)
    .filter(([id]) => !winners.includes(id))
    .sort(([a], [b]) => (voteCounts[b] ?? 0) - (voteCounts[a] ?? 0))

  return (
    <section className="panel game-body">
      {result.skipped ? (
        <p className="reveal__empty">{text.skipVoting}</p>
      ) : winners.length === 0 ? (
        <p className="reveal__empty">{text.noVotes}</p>
      ) : (
        winners.map((id) => (
          <div key={id} className="reveal__winner">
            <p className="reveal__answer">{answers[id]}</p>
            <Author room={room} playerId={id} votes={voteCounts[id] ?? 0} />
          </div>
        ))
      )}

      {others.length > 0 && (
        <div className="reveal__others">
          <span className="label">{text.allAnswers}</span>
          <ul className="reveal__list">
            {others.map(([id, answer]) => (
              <li key={id} className="reveal__item">
                <span className="reveal__item-answer">{answer}</span>
                <Author room={room} playerId={id} votes={voteCounts[id] ?? 0} small />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function Author({ room, playerId, votes, small = false }: { room: Room; playerId: string; votes: number; small?: boolean }) {
  const player = room.players?.[playerId]
  if (!player?.name) return null
  return (
    <span className={small ? 'author author--small' : 'author'}>
      <Ghost color={player.color} size={small ? 20 : 32} />
      <span style={{ color: player.color }}>{player.name}</span>
      <span className="author__votes">{text.votes(votes)}</span>
    </span>
  )
}
