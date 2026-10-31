import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { pickNextHost } from '../game/room'
import type { Room } from '../game/types'
import { db } from '../lib/firebase'
import { cancelDisconnect, claimHost, markConnected } from '../lib/rooms'

// How long a disconnected host gets to come back (e.g. a refresh) before
// someone else takes over.
const HOST_GRACE_MS = 5000

// undefined while loading, null if the room doesn't exist.
export function useRoom(code: string, playerId: string): Room | null | undefined {
  const [room, setRoom] = useState<Room | null | undefined>(undefined)

  useEffect(() => {
    if (!db) return
    return onValue(ref(db, `rooms/${code}`), (snap) => setRoom(snap.val()))
  }, [code])

  // Re-mark this player as connected every time the connection comes back.
  useEffect(() => {
    if (!db) return
    const unsubscribe = onValue(ref(db, '.info/connected'), (snap) => {
      if (snap.val() === true) void markConnected(code, playerId)
    })
    return () => {
      unsubscribe()
      void cancelDisconnect(code, playerId)
    }
  }, [code, playerId])

  // If the host is gone, the earliest-joined connected player takes over.
  useEffect(() => {
    if (!room) return
    if (pickNextHost(room.players, room.hostId) !== playerId) return
    const hostStillListed = Boolean(room.players?.[room.hostId]?.name)
    const timer = setTimeout(
      () => void claimHost(code, room.hostId, playerId),
      hostStillListed ? HOST_GRACE_MS : 0,
    )
    return () => clearTimeout(timer)
  }, [room, code, playerId])

  return room
}
