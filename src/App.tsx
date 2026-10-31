import { useEffect, useState } from 'react'
import { isValidRoomCode, normalizeRoomCode } from './game/room'
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

  if (!db) return <p className="loading">{text.errors['not-configured']}</p>
  if (checking) return <p className="loading">{text.loading}</p>

  if (!roomCode) {
    return <Home initialCode={readRoomFromUrl()} initialError={notice} onEnterRoom={enterRoom} />
  }

  return (
    <RoomView
      key={roomCode}
      code={roomCode}
      playerId={playerId}
      onLeave={() => {
        exitRoom(null)
        void leaveRoom(roomCode, playerId)
      }}
      onRoomGone={() => exitRoom(text.errors.roomClosed)}
    />
  )
}

interface RoomViewProps {
  code: string
  playerId: string
  onLeave: () => void
  onRoomGone: () => void
}

function RoomView({ code, playerId, onLeave, onRoomGone }: RoomViewProps) {
  const room = useRoom(code, playerId)
  const inRoom = Boolean(room?.players?.[playerId]?.name)

  useEffect(() => {
    if (room === null || (room && !inRoom)) onRoomGone()
  }, [room, inRoom, onRoomGone])

  if (!room || !inRoom) return <p className="loading">{text.loading}</p>
  if (room.phase === 'lobby') return <Lobby code={code} room={room} playerId={playerId} onLeave={onLeave} />
  return <Game code={code} room={room} playerId={playerId} onLeave={onLeave} />
}

export default App
