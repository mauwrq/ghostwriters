import { connectedPlayerIds, CUSTOM_OPTION, doneIds, roundPromptVotes } from '../../game/logic'
import { PROMPTS } from '../../game/prompts'
import type { Room } from '../../game/types'
import { submitPromptVote } from '../../lib/game'
import { text } from '../../text'
import { ChoiceBoard, type Choice } from './ChoiceBoard'
import { PlayerProgress } from './PlayerProgress'

export function PromptVote({ code, room, playerId }: { code: string; room: Room; playerId: string }) {
  const choices: Choice[] = [
    ...(room.promptOptions ?? []).map((index) => ({ key: String(index), text: PROMPTS[index] })),
    { key: CUSTOM_OPTION, text: text.customOption, special: true },
  ]
  const done = doneIds(room)
  const connected = connectedPlayerIds(room)

  return (
    <section className="game-body">
      <span className="label label--ink">{text.pickQuestion}</span>
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
