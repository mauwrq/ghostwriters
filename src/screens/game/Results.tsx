import { Ghost } from '../../components/Ghost'
import { answerOrder, roundResult } from '../../game/logic'
import type { Room } from '../../game/types'
import { text } from '../../text'

// After the vote: the winning answer, then who wrote everything and how many
// votes each got. The board already spelled the answers, so nothing is spelled here.
export function Results({ room }: { room: Room }) {
  const result = roundResult(room)
  const winners = result.winners ?? []
  const voteCounts = result.voteCounts ?? {}
  const answers = answerOrder(room)
  const others = answers
    .filter(([id]) => !winners.includes(id))
    .sort(([a], [b]) => (voteCounts[b] ?? 0) - (voteCounts[a] ?? 0))

  return (
    <>
      <section className="panel results__winner">
        {result.skipped || winners.length === 0 ? (
          <p className="results__message">{result.skipped ? text.skipVoting : text.noVotes}</p>
        ) : (
          winners.map((id) => (
            <div key={id} className="results__winning-answer">
              <p className="results__answer">{answers.find(([author]) => author === id)?.[1]}</p>
              <Author room={room} playerId={id} votes={voteCounts[id] ?? 0} />
            </div>
          ))
        )}
      </section>

      {others.length > 0 && (
        <section className="panel reveal__others">
          <span className="label">{text.allAnswers}</span>
          <ul className="reveal__list">
            {others.map(([id, answer]) => (
              <li key={id} className="reveal__item">
                <span className="reveal__item-answer">{answer}</span>
                <Author room={room} playerId={id} votes={voteCounts[id] ?? 0} small />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function Author({ room, playerId, votes, small = false }: { room: Room; playerId: string; votes: number; small?: boolean }) {
  const player = room.players?.[playerId]
  if (!player?.name) return null
  return (
    <span className={small ? 'author author--small' : 'author'}>
      <Ghost look={player.look} size={small ? 20 : 36} />
      <span>{player.name}</span>
      <span className="author__votes">{text.votes(votes)}</span>
    </span>
  )
}
