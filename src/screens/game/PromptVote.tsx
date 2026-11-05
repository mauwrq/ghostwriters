import { cleanQuestion, connectedPlayerIds, doneIds, newestQuestions, roundPromptVotes, roundQuestions } from '../../game/logic'
import { PROMPTS } from '../../game/prompts'
import { MAX_QUESTION_LENGTH, type Room } from '../../game/types'
import { submitPromptVote, submitQuestion } from '../../lib/game'
import { text } from '../../text'
import { ChoiceBoard, type Choice } from './ChoiceBoard'
import { PlayerProgress } from './PlayerProgress'
import { TextEntry } from './TextEntry'

// The question board. Anyone can add one question; it lands on top of the
// board on every screen and can be voted for like the rest.
export function PromptVote({ code, room, playerId }: { code: string; room: Room; playerId: string }) {
  const choices: Choice[] = [
    ...newestQuestions(room).map(([authorId, question]) => ({
      key: authorId,
      text: question.text,
      asker: room.players?.[authorId],
      mine: authorId === playerId,
    })),
    ...(room.promptOptions ?? []).map((index) => ({ key: String(index), text: PROMPTS[index].question })),
  ]
  const done = doneIds(room)
  const connected = connectedPlayerIds(room)

  return (
    <section className="game-body">
      <span className="label label--ink">{text.pickQuestion}</span>
      {!roundQuestions(room)[playerId] && (
        <TextEntry
          placeholder={text.customOption}
          maxLength={MAX_QUESTION_LENGTH}
          clean={cleanQuestion}
          autoFocus={false}
          onSubmit={(question) => void submitQuestion(code, room.round, playerId, question)}
        />
      )}
      <ChoiceBoard
        room={room}
        choices={choices}
        votes={roundPromptVotes(room)}
        playerId={playerId}
        onVote={(key) => void submitPromptVote(code, room.round, playerId, key)}
      />
      <PlayerProgress
        room={room}
        doneIds={done}
        label={text.voted(connected.filter((id) => done.includes(id)).length, connected.length)}
      />
    </section>
  )
}
