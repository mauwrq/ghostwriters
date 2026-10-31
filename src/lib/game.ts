import { child, set, update } from 'firebase/database'
import { backToLobby, nextPhase, startGame } from '../game/logic'
import type { Room } from '../game/types'
import { serverNow } from './firebase'
import { roomRef } from './rooms'

// Host-only writes.

// The timer and "everyone's done" can both fire for the same phase; only the
// first one should advance it.
const advanced = new Set<string>()

export function advancePhase(code: string, room: Room): Promise<void> {
  const key = `${code}:${room.gameStartedAt}:${room.round}:${room.phase}`
  if (advanced.has(key)) return Promise.resolve()
  advanced.add(key)
  return update(roomRef(code), nextPhase(room, serverNow()))
}

export function hostStartGame(code: string, room: Room): Promise<void> {
  return update(roomRef(code), startGame(room, serverNow()))
}

export function hostBackToLobby(code: string, room: Room): Promise<void> {
  return update(roomRef(code), backToLobby(room))
}

// Player writes: each player only ever writes their own answer and vote.

export function submitAnswer(code: string, round: number, playerId: string, answer: string): Promise<void> {
  return set(child(roomRef(code), `answers/${round}/${playerId}`), answer)
}

export function submitVote(code: string, round: number, playerId: string, targetId: string): Promise<void> {
  return set(child(roomRef(code), `votes/${round}/${playerId}`), targetId)
}
