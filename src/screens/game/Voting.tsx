import { answerOrder, connectedPlayerIds, roundVotes } from '../../game/logic'
import type { Room } from '../../game/types'
import { submitVote } from '../../lib/game'
import { text } from '../../text'
import { PlayerProgress } from './PlayerProgress'

export function Voting({ code, room, playerId }: { code: string; room: Room; playerId: string }) {
  // Anonymous, and in the order the board spelled them; the results say who wrote what.
  const options = answerOrder(room)
  const votes = roundVotes(room)
  const myVote = votes[playerId]
  const votedIds = Object.keys(votes)
  const connected = connectedPlayerIds(room)
  const doneCount = connected.filter((id) => votedIds.includes(id)).length

  return (
    <section className="game-body">
      <span className="label label--ink">{myVote ? text.youVoted : text.pickFavorite}</span>
      <ul className="options">
        {options.map(([authorId, answer]) => {
          const mine = authorId === playerId
          const chosen = authorId === myVote
          return (
            <li key={authorId}>
              <button
                type="button"
                className={chosen ? 'panel option option--chosen' : 'panel option'}
                disabled={mine}
                onClick={() => void submitVote(code, room.round, playerId, authorId)}
              >
                <span className="option__text">{answer}</span>
                {mine && <span className="tag">{text.yours}</span>}
              </button>
            </li>
          )
        })}
      </ul>

      <PlayerProgress room={room} doneIds={votedIds} label={text.voted(doneCount, connected.length)} />
    </section>
  )
}
