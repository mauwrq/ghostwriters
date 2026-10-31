import { useState } from 'react'
import { cleanQuestion, connectedPlayerIds, doneIds, roundQuestions } from '../../game/logic'
import { MAX_QUESTION_LENGTH, type Room } from '../../game/types'
import { submitQuestion } from '../../lib/game'
import { text } from '../../text'
import { PlayerProgress } from './PlayerProgress'

export function QuestionWrite({ code, room, playerId }: { code: string; room: Room; playerId: string }) {
  const myQuestion = roundQuestions(room)[playerId]
  const [draft, setDraft] = useState('')
  const done = doneIds(room)
  const connected = connectedPlayerIds(room)

  return (
    <section className="panel game-body">
      {myQuestion ? (
        <div className="submitted">
          <span className="label">{text.yourQuestion}</span>
          <p className="submitted__answer">{myQuestion}</p>
        </div>
      ) : (
        <form
          className="answer-form"
          onSubmit={(e) => {
            e.preventDefault()
            const question = cleanQuestion(draft)
            if (question) void submitQuestion(code, room.round, playerId, question)
          }}
        >
          <span className="label">{text.writeQuestion}</span>
          <input
            className="input"
            placeholder={text.questionPlaceholder}
            aria-label={text.questionPlaceholder}
            value={draft}
            maxLength={MAX_QUESTION_LENGTH}
            autoComplete="off"
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
          />
          <span className="answer-form__count">
            {draft.length}/{MAX_QUESTION_LENGTH}
          </span>
          <button className="btn btn--go btn--big" type="submit" disabled={!cleanQuestion(draft)}>
            {text.submitAnswer}
          </button>
        </form>
      )}

      <PlayerProgress
        room={room}
        doneIds={done}
        label={text.wrote(connected.filter((id) => done.includes(id)).length, connected.length)}
      />
    </section>
  )
}
