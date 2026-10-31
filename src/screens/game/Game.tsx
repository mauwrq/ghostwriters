import { finalWinners, roundPoints, roundResult } from '../../game/logic'
import type { Room } from '../../game/types'
import { useHostLoop } from '../../hooks/useHostLoop'
import { advancePhase, hostBackToLobby } from '../../lib/game'
import { text } from '../../text'
import { Answering } from './Answering'
import { GameHeader } from './GameHeader'
import { Reveal } from './Reveal'
import { Scoreboard } from './Scoreboard'
import { Voting } from './Voting'
import './Game.css'

interface Props {
  code: string
  room: Room
  playerId: string
  onLeave: () => void
}

export function Game({ code, room, playerId, onLeave }: Props) {
  const isHost = room.hostId === playerId
  useHostLoop(code, room, isHost)

  // Keyed by round and phase so typed-in state resets every phase.
  const phaseKey = `${room.gameStartedAt}:${room.round}:${room.phase}`

  return (
    <div className="game">
      <GameHeader room={room} />

      {room.phase === 'answering' && <Answering key={phaseKey} code={code} room={room} playerId={playerId} />}
      {room.phase === 'voting' && <Voting key={phaseKey} code={code} room={room} playerId={playerId} />}
      {room.phase === 'reveal' && <Reveal room={room} />}

      {room.phase === 'scores' && (
        <section className="panel game-body">
          <span className="label">{text.scores}</span>
          <Scoreboard room={room} gained={roundPoints(roundResult(room))} />
        </section>
      )}

      {room.phase === 'final' && (
        <section className="panel game-body">
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
      )}

      {/* Lets the host skip the wait on screens that only show results. */}
      {isHost && (room.phase === 'reveal' || room.phase === 'scores') && (
        <button className="btn btn--alt" type="button" onClick={() => void advancePhase(code, room)}>
          {text.next}
        </button>
      )}
    </div>
  )
}
