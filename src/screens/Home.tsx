import { useState } from 'react'
import { Ghost } from '../components/Ghost'
import { Logo } from '../components/Logo'
import { cleanName, isValidRoomCode, normalizeRoomCode, PLAYER_LOOKS } from '../game/room'
import { MAX_NAME_LENGTH } from '../game/types'
import { getPlayerId, getSavedName, saveName } from '../lib/identity'
import { createRoom, joinRoom, RoomError } from '../lib/rooms'
import { text } from '../text'
import './Home.css'

interface Props {
  initialCode: string
  initialError: string | null
  onEnterRoom: (code: string) => void
}

export function Home({ initialCode, initialError, onEnterRoom }: Props) {
  const [name, setName] = useState(getSavedName)
  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState(initialError)
  const [busy, setBusy] = useState(false)

  async function enter(action: 'join' | 'create') {
    const cleaned = cleanName(name)
    if (!cleaned) return setError(text.errors.noName)
    if (action === 'join' && !isValidRoomCode(code)) return setError(text.errors.badCode)

    setBusy(true)
    setError(null)
    saveName(cleaned)
    try {
      const playerId = getPlayerId()
      if (action === 'create') {
        onEnterRoom(await createRoom(playerId, cleaned))
      } else {
        await joinRoom(code, playerId, cleaned)
        onEnterRoom(code)
      }
    } catch (err) {
      setError(err instanceof RoomError ? text.errors[err.code] : text.errors.generic)
      setBusy(false)
    }
  }

  return (
    <div className="home">
      <Logo />

      <div className="home__ghosts">
        {PLAYER_LOOKS.map((look) => (
          <span key={look} className="bob" style={{ animationDelay: `${look * -0.3}s` }}>
            <Ghost look={look} size={40} />
          </span>
        ))}
      </div>

      <form
        className="panel home__panel"
        onSubmit={(e) => {
          e.preventDefault()
          void enter('join')
        }}
      >
        <input
          className="input"
          placeholder={text.namePlaceholder}
          aria-label={text.namePlaceholder}
          value={name}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="nickname"
          onChange={(e) => setName(e.target.value)}
        />

        <div className="home__join">
          <input
            className="input home__code"
            placeholder={text.codePlaceholder}
            aria-label={text.codePlaceholder}
            value={code}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
          />
          <button className="btn btn--go" type="submit" disabled={busy}>
            {text.join}
          </button>
        </div>

        <button className="btn btn--alt" type="button" disabled={busy} onClick={() => void enter('create')}>
          {text.create}
        </button>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
