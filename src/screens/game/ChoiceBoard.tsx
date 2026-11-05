import { Ghost } from '../../components/Ghost'
import type { Votes } from '../../game/logic'
import { sortedPlayers } from '../../game/room'
import type { Player, Room } from '../../game/types'
import { text } from '../../text'

export interface Choice {
  key: string
  text: string
  mine?: boolean
  // Who added this question to the board, if a player did.
  asker?: Player
}

interface Props {
  room: Room
  choices: Choice[]
  votes: Votes
  playerId: string
  onVote: (key: string) => void
}

// A list of options where everyone can see who voted for what.
export function ChoiceBoard({ room, choices, votes, playerId, onVote }: Props) {
  const players = sortedPlayers(room.players)

  return (
    <ul className="options">
      {choices.map((choice) => {
        const voters = players.filter(([id]) => votes[id] === choice.key)
        const classes = ['panel', 'option']
        if (votes[playerId] === choice.key) classes.push('option--chosen')
        return (
          <li key={choice.key} className={choice.asker ? 'option-row--arriving' : undefined}>
            <div>
              <button type="button" className={classes.join(' ')} disabled={choice.mine} onClick={() => onVote(choice.key)}>
                {choice.asker && (
                  <span className="option__asker" title={choice.asker.name}>
                    <Ghost look={choice.asker.look} size={28} />
                  </span>
                )}
                <span className="option__text">{choice.text}</span>
                {choice.mine && <span className="tag">{text.yours}</span>}
                {voters.length > 0 && (
                  <span className="option__voters">
                    {voters.map(([id, player]) => (
                      <span key={id} title={player.name}>
                        <Ghost look={player.look} size={22} />
                      </span>
                    ))}
                  </span>
                )}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
