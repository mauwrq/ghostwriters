import { cleanAnswer, connectedPlayerIds, roundAnswers } from '../../game/logic'
import { MAX_ANSWER_LENGTH, type Room } from '../../game/types'
import { submitAnswer } from '../../lib/game'
import { text } from '../../text'
import { PlayerProgress } from './PlayerProgress'
import { TextEntry } from './TextEntry'

export function Answering({ code, room, playerId }: { code: string; room: Room; playerId: string }) {
  const answers = roundAnswers(room)
  const myAnswer = answers[playerId]
  const answeredIds = Object.keys(answers)
  const connected = connectedPlayerIds(room)
  const doneCount = connected.filter((id) => answeredIds.includes(id)).length

  return (
    <section className="game-body">
      {myAnswer ? (
        <div className="submitted">
          <span className="label label--ink">{text.yourAnswer}</span>
          <p className="submitted__answer">{myAnswer}</p>
        </div>
      ) : (
        <TextEntry
          placeholder={text.answerPlaceholder}
          maxLength={MAX_ANSWER_LENGTH}
          clean={cleanAnswer}
          onSubmit={(answer) => void submitAnswer(code, room.round, playerId, answer)}
        />
      )}

      <PlayerProgress room={room} doneIds={answeredIds} label={text.answered(doneCount, connected.length)} />
    </section>
  )
}
