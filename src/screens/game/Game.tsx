import { useEffect } from 'react'
import { roundPoints, roundResult } from '../../game/logic'
import type { Phase, Room } from '../../game/types'
import { useHostLoop } from '../../hooks/useHostLoop'
import { usePhaseFade } from '../../hooks/usePhaseFade'
import { advancePhase } from '../../lib/game'
import { startMusic, stopMusic } from '../../lib/sound'
import { text } from '../../text'
import { Answering } from './Answering'
import { Credits } from './Credits'
import { GameHeader } from './GameHeader'
import { Intro } from './Intro'
import { PromptVote } from './PromptVote'
import { Results } from './Results'
import { Seance } from './Seance'
import { Scoreboard } from './Scoreboard'
import { Voting } from './Voting'
import './Game.css'

interface Props {
  code: string
  room: Room
  playerId: string
  onLeave: () => void
}

export function Game({ code, room: liveRoom, playerId, onLeave }: Props) {
  const isHost = liveRoom.hostId === playerId
  useHostLoop(code, liveRoom, isHost)

  // The music plays from the start of the game until back in the lobby or out.
  useEffect(() => {
    startMusic()
    return stopMusic
  }, [])

  // Each screen fades out before the next fades in. The key also resets any
  // typed-in state between phases.
  const phaseKey = `${liveRoom.gameStartedAt}:${liveRoom.round}:${liveRoom.phase}`
  const { shownKey, shownValue: room, leaving } = usePhaseFade(phaseKey, liveRoom)
  const phase = shownKey.split(':')[2] as Phase
  const sceneClass = ['scene', phase === 'seance' && 'scene--seance', leaving && 'scene--leaving']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={phase === 'seance' ? 'game game--wide' : 'game'}>
      <GameHeader room={room} />

      <div key={shownKey} className={sceneClass}>
        {(phase === 'answering' || phase === 'voting') && <h2 className="panel game-prompt">{room.prompt}</h2>}

        {phase === 'intro' && <Intro />}
        {phase === 'promptVote' && <PromptVote code={code} room={room} playerId={playerId} />}
        {phase === 'answering' && <Answering code={code} room={room} playerId={playerId} />}
        {phase === 'voting' && <Voting code={code} room={room} playerId={playerId} />}
        {phase === 'seance' && <Seance room={room} />}
        {phase === 'reveal' && <Results room={room} />}

        {phase === 'scores' && (
          <section className="panel game-body">
            <span className="label">{text.scores}</span>
            <Scoreboard room={room} gained={roundPoints(roundResult(room))} />
          </section>
        )}

        {phase === 'final' && <Credits code={code} room={room} isHost={isHost} onLeave={onLeave} />}

        {/* Lets the host skip the wait on screens with nothing to do. */}
        {isHost && (phase === 'intro' || phase === 'reveal' || phase === 'scores') && (
          <button className="btn btn--alt" type="button" onClick={() => void advancePhase(code, room)}>
            {text.next}
          </button>
        )}
      </div>
    </div>
  )
}
