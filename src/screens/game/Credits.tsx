import type { ReactNode } from 'react'
import { Ghost } from '../../components/Ghost'
import { finalWinners } from '../../game/logic'
import { buildStory, gameStats } from '../../game/story'
import type { Room } from '../../game/types'
import { hostBackToLobby } from '../../lib/game'
import { text } from '../../text'
import { Scoreboard } from './Scoreboard'

interface Props {
  code: string
  room: Room
  isHost: boolean
  onLeave: () => void
}

// The end of the game, like a film's credits: the story the winning answers
// told, how everyone voted, then the final scores. Each part fades in after
// the one before.
export function Credits({ code, room, isHost, onLeave }: Props) {
  const story = buildStory(room)
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
      <section className="credits__part">
        <span className="label label--ink">{text.theStory}</span>
        <p className="panel credits__story">
          {story.map((sentence, i) => (
            <span key={i}>
              {sentence.map((part, j) =>
                part.blank ? (
                  <span key={j} className="credits__blank">
                    {part.text}
                  </span>
                ) : (
                  part.text
                ),
              )}{' '}
            </span>
          ))}
        </p>
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

      <section className="credits__part panel game-body">
        <span className="label">{text.finalScores}</span>
        <Scoreboard room={room} highlight={finalWinners(room)} />
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
