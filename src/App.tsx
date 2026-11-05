import { useEffect, useState } from 'react'
import { isValidRoomCode, normalizeRoomCode } from './game/room'
import { FADE_OUT_MS, usePhaseFade } from './hooks/usePhaseFade'
import { usePlayerSounds } from './hooks/usePlayerSounds'
import { useRoom } from './hooks/useRoom'
import { db } from './lib/firebase'
import { getPlayerId } from './lib/identity'
import { leaveRoom, rejoinRoom } from './lib/rooms'
import { Game } from './screens/game/Game'
import { Home } from './screens/Home'
import { Lobby } from './screens/Lobby'
import { text } from './text'

// The room code lives in the URL (?room=ABCD), which makes the invite link
// work and lets a refresh put you back in your room.
function readRoomFromUrl(): string {
  return normalizeRoomCode(new URLSearchParams(location.search).get('room') ?? '')
}

function writeRoomToUrl(code: string | null): void {
  const url = new URL(location.href)
  if (code) url.searchParams.set('room', code)
  else url.searchParams.delete('room')
  history.replaceState(null, '', url)
}

function App() {
  const playerId = getPlayerId()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [checking, setChecking] = useState(() => Boolean(db) && isValidRoomCode(readRoomFromUrl()))
  const [notice, setNotice] = useState<string | null>(null)

  function enterRoom(code: string) {
    setNotice(null)
    setRoomCode(code)
    writeRoomToUrl(code)
  }

  function exitRoom(message: string | null) {
    setRoomCode(null)
    setNotice(message)
    writeRoomToUrl(null)
  }

  // After a refresh, go straight back into the room if this tab was in it.
  useEffect(() => {
    if (!checking) return
    const code = readRoomFromUrl()
    void rejoinRoom(code, playerId).then((ok) => {
      if (ok) enterRoom(code)
      setChecking(false)
    })
  }, [checking, playerId])

  // Home and a room fade into each other, like the screens inside a game.
  const { shownKey, leaving } = usePhaseFade(roomCode ? `room:${roomCode}` : 'home', null)
  const shownCode = shownKey.startsWith('room:') ? shownKey.slice('room:'.length) : null

  if (!db) return <p className="loading">{text.errors['not-configured']}</p>
  if (checking) return <p className="loading">{text.loading}</p>

  return (
    <div key={shownKey} className={leaving ? 'screen screen--leaving' : 'screen'}>
      {shownCode ? (
        <RoomView
          code={shownCode}
          playerId={playerId}
          leaving={leaving}
          onLeave={() => {
            exitRoom(null)
            // Stay in the room until the fade-out finishes, so the room
            // doesn't see us gone while we're still on screen.
            setTimeout(() => void leaveRoom(shownCode, playerId), FADE_OUT_MS)
          }}
          onRoomGone={() => exitRoom(text.errors.roomClosed)}
        />
      ) : (
        <Home initialCode={readRoomFromUrl()} initialError={notice} onEnterRoom={enterRoom} />
      )}
    </div>
  )
}

interface RoomViewProps {
  code: string
  playerId: string
  // True while this room is fading out after we left it.
  leaving: boolean
  onLeave: () => void
  onRoomGone: () => void
}

function RoomView({ code, playerId, leaving, onLeave, onRoomGone }: RoomViewProps) {
  const liveRoom = useRoom(code, playerId)
  const inRoom = Boolean(liveRoom?.players?.[playerId]?.name)
  usePlayerSounds(liveRoom?.phase === 'lobby' ? liveRoom.players : undefined, playerId)

  useEffect(() => {
    if (leaving) return
    if (liveRoom === null || (liveRoom && !inRoom)) onRoomGone()
  }, [liveRoom, inRoom, leaving, onRoomGone])

  // The lobby and the game fade into each other too.
  const stage = liveRoom?.phase === 'lobby' ? 'lobby' : 'game'
  const { shownKey, shownValue: room, leaving: switching } = usePhaseFade(stage, liveRoom)

  // Blank while the room loads; the lobby or game then fades in.
  if (!room || !inRoom) return null
  return (
    <div key={shownKey} className={switching ? 'screen screen--leaving' : 'screen'}>
      {shownKey === 'lobby' ? (
        <Lobby code={code} room={room} playerId={playerId} onLeave={onLeave} />
      ) : (
        <Game code={code} room={room} playerId={playerId} onLeave={onLeave} />
      )}
    </div>
  )
}

export default App
