import { cleanQuestion, connectedPlayerIds, doneIds, roundQuestions } from '../../game/logic'
import { MAX_QUESTION_LENGTH, type Room } from '../../game/types'
import { submitQuestion } from '../../lib/game'
import { text } from '../../text'
import { PlayerProgress } from './PlayerProgress'
import { TextEntry } from './TextEntry'

export function QuestionWrite({ code, room, playerId }: { code: string; room: Room; playerId: string }) {
  const myQuestion = roundQuestions(room)[playerId]
  const done = doneIds(room)
  const connected = connectedPlayerIds(room)

  return (
    <section className="game-body">
      {myQuestion ? (
        <div className="submitted">
          <span className="label label--ink">{text.yourQuestion}</span>
          <p className="submitted__answer">{myQuestion}</p>
        </div>
      ) : (
        <>
          <span className="label label--ink">{text.writeQuestion}</span>
          <TextEntry
            placeholder={text.questionPlaceholder}
            maxLength={MAX_QUESTION_LENGTH}
            clean={cleanQuestion}
            onSubmit={(question) => void submitQuestion(code, room.round, playerId, question)}
          />
        </>
      )}

      <PlayerProgress
        room={room}
        doneIds={done}
        label={text.wrote(connected.filter((id) => done.includes(id)).length, connected.length)}
      />
    </section>
  )
}
