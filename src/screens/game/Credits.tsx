import type { ReactNode } from 'react'
import { Ghost } from '../../components/Ghost'
import { gameStats, roundRecaps } from '../../game/credits'
import { finalWinners } from '../../game/logic'
import type { Room } from '../../game/types'
import { hostBackToLobby } from '../../lib/game'
import { text } from '../../text'
import { Author } from './Results'
import { Scoreboard } from './Scoreboard'

interface Props {
  code: string
  room: Room
  isHost: boolean
  onLeave: () => void
}

// The end of the game, like a film's credits: the final scores, how everyone
// voted, then each question with the answer voted in and everyone else's below
// it. Each part fades in after the one before.
export function Credits({ code, room, isHost, onLeave }: Props) {
  const recaps = roundRecaps(room)
  const stats = gameStats(room)
  const name = (id: string) => <PlayerName room={room} playerId={id} />

  const rows: [string, ReactNode][] = []
  if (stats.topAnswer) {
    rows.push([
      text.topAnswer,
      <>
        "{stats.topAnswer.text}" {name(stats.topAnswer.authorId)}{' '}
        <span className="credits__detail">{text.votes(stats.topAnswer.votes)}</span>
      </>,
    ])
  }
  if (stats.crowdFavorite) {
    rows.push([
      text.crowdFavorite,
      <>
        {name(stats.crowdFavorite.playerId)} <span className="credits__detail">{text.votes(stats.crowdFavorite.votes)}</span>
      </>,
    ])
  }
  if (stats.biggestFan) {
    rows.push([
      text.biggestFan,
      <>
        {name(stats.biggestFan.fanId)} → {name(stats.biggestFan.idolId)}{' '}
        <span className="credits__detail">{text.votedFor(stats.biggestFan.times)}</span>
      </>,
    ])
  }
  if (stats.withTheCrowd) {
    rows.push([
      text.withTheCrowd,
      <>
        {name(stats.withTheCrowd.playerId)}{' '}
        <span className="credits__detail">{text.timesWithWinner(stats.withTheCrowd.times)}</span>
      </>,
    ])
  }

  return (
    <div className="credits">
      <section className="credits__part panel game-body">
        <span className="label">{text.finalScores}</span>
        <Scoreboard room={room} highlight={finalWinners(room)} />
      </section>

      {rows.length > 0 && (
        <dl className="credits__part credits__stats">
          {rows.map(([label, value]) => (
            <div key={label} className="credits__stat">
              <dt className="label label--ink">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <section className="credits__part">
        <span className="label label--ink">{text.allAnswers}</span>
        {recaps.map((recap) => (
          <article key={recap.round} className="panel credits__round">
            <h3 className="credits__question">{recap.question}</h3>
            {recap.winners.map((answer) => (
              <div key={answer.authorId} className="credits__voted-in">
                <p className="credits__answer">{answer.text}</p>
                <Author room={room} playerId={answer.authorId} votes={answer.votes} small />
              </div>
            ))}
            {recap.others.length > 0 && (
              <ul className="reveal__list">
                {recap.others.map((answer) => (
                  <li key={answer.authorId} className="reveal__item">
                    <span className="reveal__item-answer">{answer.text}</span>
                    <Author room={room} playerId={answer.authorId} votes={answer.votes} small />
                  </li>
                ))}
              </ul>
            )}
            {recap.winners.length + recap.others.length === 0 && <p className="hint">{text.noAnswer}</p>}
          </article>
        ))}
        {isHost ? (
          <button className="btn btn--go btn--big" type="button" onClick={() => void hostBackToLobby(code, room)}>
            {text.playAgain}
          </button>
        ) : (
          <p className="hint">{text.waitingForHostNext}</p>
        )}
        <button className="btn btn--quiet" type="button" onClick={onLeave}>
          {text.leave}
        </button>
      </section>
    </div>
  )
}

function PlayerName({ room, playerId }: { room: Room; playerId: string }) {
  const player = room.players?.[playerId]
  if (!player?.name) return null
  return (
    <span className="credits__player">
      <Ghost look={player.look} size={22} />
      {player.name}
    </span>
  )
}
