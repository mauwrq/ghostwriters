import { OuijaBoard } from '../../components/OuijaBoard'
import type { Room } from '../../game/types'
import { useSeance } from '../../hooks/useSeance'
import { text } from '../../text'

// The séance: the question types itself out under the board, then the
// planchette spells every answer in turn while the spirit's box at the top
// fills in. No names: authors stay hidden until after the vote.
export function Seance({ room }: { room: Room }) {
  const { texts, promptShown, planchette, spelling } = useSeance(room)
  const words = spelling ? (texts[planchette.index] ?? '').slice(0, planchette.shown) : ''

  return (
    <section className="seance">
      <span className="label label--ink">{text.watchBoard}</span>

      <div className="panel dialogue">
        <p className="dialogue__text" aria-live="polite">{words}</p>
      </div>

      <OuijaBoard x={planchette.x} y={planchette.y} />

      <h2 className="panel seance__prompt">
        {room.prompt.slice(0, promptShown)}
      </h2>
    </section>
  )
}
