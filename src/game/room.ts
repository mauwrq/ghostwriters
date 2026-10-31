// Pure room helpers: no Firebase, no React, so they are easy to test.
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS, type Player } from './types'

// No I or O, so codes can't be misread as 1 or 0.
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
export const ROOM_CODE_LENGTH = 4

// One ghost pattern per player slot.
export const PLAYER_LOOKS = Array.from({ length: MAX_PLAYERS }, (_, i) => i)

export type Players = Record<string, Player> | null | undefined

export function generateRoomCode(random: () => number = Math.random): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CODE_LETTERS[Math.floor(random() * CODE_LETTERS.length)]
  }
  return code
}

export function normalizeRoomCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z]/g, '').slice(0, ROOM_CODE_LENGTH)
}

export function isValidRoomCode(code: string): boolean {
  return code.length === ROOM_CODE_LENGTH && [...code].every((c) => CODE_LETTERS.includes(c))
}

export function cleanName(input: string): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH).trim()
}

// A record without a name is left over from a presence write after the
// player was removed; it isn't a real player.
export function sortedPlayers(players: Players): [string, Player][] {
  return Object.entries(players ?? {})
    .filter(([, p]) => Boolean(p?.name))
    .sort(([idA, a], [idB, b]) => a.joinedAt - b.joinedAt || idA.localeCompare(idB))
}

export function pickLook(players: Players): number | undefined {
  const used = new Set(sortedPlayers(players).map(([, p]) => p.look))
  return PLAYER_LOOKS.find((look) => !used.has(look))
}

export function isFull(players: Players): boolean {
  return sortedPlayers(players).length >= MAX_PLAYERS
}

export function canStart(players: Players): boolean {
  return sortedPlayers(players).filter(([, p]) => p.connected).length >= MIN_PLAYERS
}

// Who should take over as host: null if the current host is still connected
// or nobody is left to take over.
export function pickNextHost(players: Players, hostId: string): string | null {
  const list = sortedPlayers(players)
  const host = list.find(([id]) => id === hostId)
  if (host?.[1].connected) return null
  const next = list.find(([, p]) => p.connected)
  return next ? next[0] : null
}
