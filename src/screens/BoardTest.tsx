import { useState } from 'react'
import { OuijaBoard } from '../components/OuijaBoard'
import { MAX_ANSWER_LENGTH } from '../game/types'
import { usePlanchette } from '../hooks/usePlanchette'
import { serverNow } from '../lib/firebase'
import { text } from '../text'
import './game/Game.css'

// Open the site with ?board to try the planchette on any text, without
// playing a game. Separate texts with | to see how ties are spelled.
export function BoardTest() {
  const [draft, setDraft] = useState('hello there')
  const [texts, setTexts] = useState<string[]>([])
  const [startAt, setStartAt] = useState(0)
  const planchette = usePlanchette(texts.length > 0 ? texts : [''], startAt)
  const current = texts[planchette.index] ?? ''

  return (
    <div className="game game--wide">
      <form
        className="answer-form"
        onSubmit={(e) => {
          e.preventDefault()
          setTexts(draft.split('|').map((t) => t.trim().slice(0, MAX_ANSWER_LENGTH)))
          setStartAt(serverNow())
        }}
      >
        <input
          className="input"
          placeholder={text.boardTestPlaceholder}
          aria-label={text.boardTestPlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn" type="submit">
          {text.boardTestSpell}
        </button>
      </form>

      <OuijaBoard x={planchette.x} y={planchette.y} />

      <p className="reveal__spelled">
        {current.slice(0, planchette.shown)}
        {planchette.stage === 'spelling' && texts.length > 0 && <span className="reveal__cursor" />}
      </p>
    </div>
  )
}
