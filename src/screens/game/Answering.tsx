import { useState } from 'react'
import { cleanAnswer, connectedPlayerIds, roundAnswers } from '../../game/logic'
import { MAX_ANSWER_LENGTH, type Room } from '../../game/types'
import { submitAnswer } from '../../lib/game'
import { text } from '../../text'
import { PlayerProgress } from './PlayerProgress'

export function Answering({ code, room, playerId }: { code: string; room: Room; playerId: string }) {
  const answers = roundAnswers(room)
  const myAnswer = answers[playerId]
  const [draft, setDraft] = useState('')
  const answeredIds = Object.keys(answers)
  const connected = connectedPlayerIds(room)
  const doneCount = connected.filter((id) => answeredIds.includes(id)).length

  return (
    <section className="panel game-body">
      {myAnswer ? (
        <div className="submitted">
          <span className="label">{text.yourAnswer}</span>
          <p className="submitted__answer">{myAnswer}</p>
        </div>
      ) : (
        <form
          className="answer-form"
          onSubmit={(e) => {
            e.preventDefault()
            const answer = cleanAnswer(draft)
            if (answer) void submitAnswer(code, room.round, playerId, answer)
          }}
        >
          <input
            className="input"
            placeholder={text.answerPlaceholder}
            aria-label={text.answerPlaceholder}
            value={draft}
            maxLength={MAX_ANSWER_LENGTH}
            autoComplete="off"
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
          />
          <span className="answer-form__count">
            {draft.length}/{MAX_ANSWER_LENGTH}
          </span>
          <button className="btn btn--go btn--big" type="submit" disabled={!cleanAnswer(draft)}>
            {text.submitAnswer}
          </button>
        </form>
      )}

      <PlayerProgress room={room} doneIds={answeredIds} label={text.answered(doneCount, connected.length)} />
    </section>
  )
}
