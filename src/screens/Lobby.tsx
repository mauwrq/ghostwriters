import { useState } from 'react'
import { Ghost } from '../components/Ghost'
import { Logo } from '../components/Logo'
import { canStart, sortedPlayers } from '../game/room'
import { MAX_PLAYERS, MIN_PLAYERS, ROUND_OPTIONS, type Room } from '../game/types'
import { hostStartGame } from '../lib/game'
import { setTotalRounds } from '../lib/rooms'
import { text } from '../text'
import './Lobby.css'

interface Props {
  code: string
  room: Room
  playerId: string
  onLeave: () => void
}

export function Lobby({ code, room, playerId, onLeave }: Props) {
  const players = sortedPlayers(room.players)
  const isHost = room.hostId === playerId
  const ready = canStart(room.players)
  const inviteLink = `${location.origin}${location.pathname}?room=${code}`

  return (
    <div className="lobby">
      <Logo small />

      <div className="lobby__layout">
        <section className="panel lobby__players">
          <h2 className="panel__title">
            {text.players} {players.length}/{MAX_PLAYERS}
          </h2>
          <ul className="player-list">
            {players.map(([id, player]) => (
              <li key={id} className={player.connected ? 'player' : 'player player--away'}>
                <Ghost color={player.color} size={32} />
                <span className="player__name" style={{ color: player.color }}>
                  {player.name}
                </span>
                {id === room.hostId && <span className="tag tag--host">{text.host}</span>}
                {id === playerId && <span className="tag">{text.you}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel lobby__room">
          <div className="lobby__code">
            <span className="label">{text.roomCode}</span>
            <span className="lobby__code-value">{code}</span>
          </div>

          <InviteLink link={inviteLink} />

          <label className="field">
            <span className="label">{text.rounds}</span>
            <select
              className="input"
              value={room.totalRounds}
              disabled={!isHost}
              onChange={(e) => void setTotalRounds(code, Number(e.target.value))}
            >
              {ROUND_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          {isHost ? (
            <>
              <button
                className="btn btn--go btn--big"
                type="button"
                disabled={!ready}
                onClick={() => void hostStartGame(code, room)}
              >
                {text.start}
              </button>
              {!ready && <p className="hint">{text.needPlayers(MIN_PLAYERS)}</p>}
            </>
          ) : (
            <p className="hint">{text.waitingForHost}</p>
          )}

          <button className="btn btn--quiet" type="button" onClick={onLeave}>
            {text.leave}
          </button>
        </section>
      </div>
    </div>
  )
}

function InviteLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  async function copy(input: HTMLInputElement | null) {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // The clipboard API needs https or localhost (not a phone on the local
      // network), so fall back to selecting the text.
      input?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="field">
      <span className="label">{text.inviteLink}</span>
      <div className="invite">
        <input
          className="input invite__link"
          value={link}
          readOnly
          aria-label={text.inviteLink}
          onFocus={(e) => e.target.select()}
        />
        <button
          className="btn btn--alt"
          type="button"
          onClick={(e) => void copy(e.currentTarget.previousElementSibling as HTMLInputElement)}
        >
          {copied ? text.copied : text.copy}
        </button>
      </div>
    </div>
  )
}
