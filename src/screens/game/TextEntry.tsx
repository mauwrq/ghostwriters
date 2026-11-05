import { useState } from 'react'
import { text } from '../../text'

interface Props {
  placeholder: string
  maxLength: number
  clean: (input: string) => string
  onSubmit: (value: string) => void
  autoFocus?: boolean
}

// A black box with a text field and a submit button beside it.
export function TextEntry({ placeholder, maxLength, clean, onSubmit, autoFocus = true }: Props) {
  const [draft, setDraft] = useState('')

  return (
    <form
      className="panel entry"
      onSubmit={(e) => {
        e.preventDefault()
        const value = clean(draft)
        if (value) onSubmit(value)
      }}
    >
      <div className="entry__row">
        <input
          className="input entry__input"
          placeholder={placeholder}
          aria-label={placeholder}
          value={draft}
          maxLength={maxLength}
          autoComplete="off"
          autoFocus={autoFocus}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn" type="submit" disabled={!clean(draft)}>
          {text.submitAnswer}
        </button>
      </div>
      <span className="entry__count">
        {draft.length}/{maxLength}
      </span>
    </form>
  )
}
