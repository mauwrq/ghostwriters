import { Ghost } from '../../components/Ghost'
import { OuijaBoard } from '../../components/OuijaBoard'
import { REVEAL_TAIL_MS, roundAnswers, roundResult } from '../../game/logic'
import { revealMs } from '../../game/spelling'
import type { Room } from '../../game/types'
import { serverNow } from '../../lib/firebase'
import { usePlanchette } from '../../hooks/usePlanchette'
import { text } from '../../text'

export function Reveal({ room }: { room: Room }) {
  const result = roundResult(room)
  const winners = result.winners ?? []

  if (result.skipped || winners.length === 0) {
    return (
      <section className="panel game-body">
        <p className="reveal__empty">{result.skipped ? text.skipVoting : text.noVotes}</p>
        <OtherAnswers room={room} exclude={[]} />
      </section>
    )
  }
  return <Spelling room={room} winners={winners} />
}

function Spelling({ room, winners }: { room: Room; winners: string[] }) {
  const answers = roundAnswers(room)
  const voteCounts = roundResult(room).voteCounts ?? {}
  const texts = winners.map((id) => answers[id] ?? '')
  // The host scheduled the end of this phase; the spelling started that long before it.
  const startAt = (room.phaseEndsAt ?? serverNow()) - REVEAL_TAIL_MS - revealMs(texts)
  const planchette = usePlanchette(texts, startAt)
  const current = texts[planchette.index]
  const authorShown = planchette.stage !== 'spelling'

  return (
    <section className="game-body reveal">
      <OuijaBoard x={planchette.x} y={planchette.y} />

      {/* The spirit's words appear in a dialogue box, letter by letter. */}
      <div className="panel reveal__dialogue">
        <p className="reveal__spelled" aria-live="polite">
          {current.slice(0, planchette.shown)}
          {planchette.stage === 'spelling' && <span className="reveal__cursor" />}
        </p>
        <div className={authorShown ? 'reveal__author reveal__author--shown' : 'reveal__author'}>
          {authorShown && (
            <Author room={room} playerId={winners[planchette.index]} votes={voteCounts[winners[planchette.index]] ?? 0} />
          )}
        </div>
      </div>

      {planchette.stage === 'done' && (
        <div className="panel reveal__others">
          {winners.length > 1 && (
            <ul className="reveal__list">
              {winners.map((id) => (
                <li key={id} className="reveal__item">
                  <span className="reveal__item-answer">{answers[id]}</span>
                  <Author room={room} playerId={id} votes={voteCounts[id] ?? 0} small />
                </li>
              ))}
            </ul>
          )}
          <OtherAnswers room={room} exclude={winners} />
        </div>
      )}
    </section>
  )
}

function OtherAnswers({ room, exclude }: { room: Room; exclude: string[] }) {
  const voteCounts = roundResult(room).voteCounts ?? {}
  const others = Object.entries(roundAnswers(room))
    .filter(([id]) => !exclude.includes(id))
    .sort(([a], [b]) => (voteCounts[b] ?? 0) - (voteCounts[a] ?? 0))
  if (others.length === 0) return null

  return (
    <div className="reveal__group">
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
