import { connectedPlayerIds, doneIds, roundQuestions, roundQuestionVotes, seededShuffle } from '../../game/logic'
import type { Room } from '../../game/types'
import { submitQuestionVote } from '../../lib/game'
import { text } from '../../text'
import { ChoiceBoard } from './ChoiceBoard'
import { PlayerProgress } from './PlayerProgress'

export function QuestionVote({ code, room, playerId }: { code: string; room: Room; playerId: string }) {
  // Who wrote each question stays hidden; who voted for it is shown.
  const questions = seededShuffle(Object.entries(roundQuestions(room)), `${code}:${room.gameStartedAt}:${room.round}:q`)
  const choices = questions.map(([authorId, question]) => ({ key: authorId, text: question, mine: authorId === playerId }))
  const done = doneIds(room)
  const connected = connectedPlayerIds(room)

  return (
    <section className="game-body">
      <span className="label label--ink">{text.pickWrittenQuestion}</span>
      <ChoiceBoard
        room={room}
        choices={choices}
        votes={roundQuestionVotes(room)}
        playerId={playerId}
        onVote={(authorId) => void submitQuestionVote(code, room.round, playerId, authorId)}
      />
      <PlayerProgress
        room={room}
        doneIds={done}
        label={text.voted(connected.filter((id) => done.includes(id)).length, connected.length)}
      />
    </section>
  )
}
