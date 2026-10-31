import { child, get, onDisconnect, ref, remove, runTransaction, set } from 'firebase/database'
import { generateRoomCode, isFull, pickColor, PLAYER_COLORS, sortedPlayers } from '../game/room'
import { DEFAULT_ROUNDS, type Phase, type Player, type Room } from '../game/types'
import { db, serverNow } from './firebase'

export type RoomErrorCode = 'not-found' | 'full' | 'in-progress' | 'no-code' | 'not-configured'

export class RoomError extends Error {
  code: RoomErrorCode
  constructor(code: RoomErrorCode) {
    super(code)
    this.code = code
  }
}

function database() {
  if (!db) throw new RoomError('not-configured')
  return db
}

export function roomRef(code: string) {
  return ref(database(), `rooms/${code}`)
}

export async function createRoom(playerId: string, name: string): Promise<string> {
  // Try random codes until one is free. The transaction only writes if
  // nothing is at rooms/{code} on the server, so two hosts can't collide.
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRoomCode()
    const now = serverNow()
    const room: Room = {
      hostId: playerId,
      createdAt: now,
      phase: 'lobby',
      round: 0,
      totalRounds: DEFAULT_ROUNDS,
      phaseEndsAt: null,
      prompt: '',
      players: {
        [playerId]: { name, color: PLAYER_COLORS[0], score: 0, connected: true, joinedAt: now },
      },
    }
    const result = await runTransaction(roomRef(code), (current) => (current === null ? room : undefined))
    if (result.committed) return code
  }
  throw new RoomError('no-code')
}

export async function joinRoom(code: string, playerId: string, name: string): Promise<void> {
  const phaseSnap = await get(child(roomRef(code), 'phase'))
  if (!phaseSnap.exists()) throw new RoomError('not-found')
  const phase = phaseSnap.val() as Phase

  // The color and the player count are checked inside a transaction so two
  // people joining at once can't get the same color or overfill the room.
  let failure: RoomErrorCode | null = null
  const result = await runTransaction(child(roomRef(code), 'players'), (current: Record<string, Player> | null) => {
    failure = null
    const players = current ?? {}
    const existing = players[playerId]
    if (existing?.name) {
      return { ...players, [playerId]: { ...existing, name, connected: true } }
    }
    if (phase !== 'lobby') {
      failure = 'in-progress'
      return undefined
    }
    const color = pickColor(players)
    if (isFull(players) || !color) {
      failure = 'full'
      return undefined
    }
    return {
      ...players,
      [playerId]: { name, color, score: 0, connected: true, joinedAt: serverNow() },
    }
  })
  if (!result.committed) throw new RoomError(failure ?? 'full')
}

// Rejoin after a refresh. Returns false if this tab isn't in that room.
export async function rejoinRoom(code: string, playerId: string): Promise<boolean> {
  try {
    const nameSnap = await get(child(roomRef(code), `players/${playerId}/name`))
    if (!nameSnap.exists()) return false
    await joinRoom(code, playerId, nameSnap.val())
    return true
  } catch {
    return false
  }
}

export async function leaveRoom(code: string, playerId: string): Promise<void> {
  const playerRef = child(roomRef(code), `players/${playerId}`)
  // Cancel first, or the pending disconnect write would recreate the player.
  await onDisconnect(child(playerRef, 'connected')).cancel()

  const phaseSnap = await get(child(roomRef(code), 'phase'))
  if (phaseSnap.val() !== 'lobby') {
    // Mid-game, keep the player and their score in case they come back.
    await set(child(playerRef, 'connected'), false)
    return
  }
  await remove(playerRef)
  const playersSnap = await get(child(roomRef(code), 'players'))
  if (sortedPlayers(playersSnap.val()).length === 0) await remove(roomRef(code))
}

// Marks this player connected now, and disconnected whenever the connection
// drops (tab closed, phone locked, network lost).
export async function markConnected(code: string, playerId: string): Promise<void> {
  const playerRef = child(roomRef(code), `players/${playerId}`)
  await onDisconnect(child(playerRef, 'connected')).set(false)
  // Only touch a player that still exists, so a stale tab can't recreate one.
  await runTransaction(playerRef, (current: Player | null) =>
    current?.name ? { ...current, connected: true } : current,
  )
}

export function cancelDisconnect(code: string, playerId: string): Promise<void> {
  return onDisconnect(child(roomRef(code), `players/${playerId}/connected`)).cancel()
}

export async function claimHost(code: string, oldHostId: string, newHostId: string): Promise<void> {
  // Only take over if nobody else already did.
  await runTransaction(child(roomRef(code), 'hostId'), (current: string | null) =>
    current === oldHostId || current === null ? newHostId : undefined,
  )
}

export function setTotalRounds(code: string, rounds: number): Promise<void> {
  return set(child(roomRef(code), 'totalRounds'), rounds)
}
