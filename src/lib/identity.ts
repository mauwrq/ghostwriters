// The player ID lives in sessionStorage, which is per tab and survives a
// refresh. That way a refresh rejoins as the same player, and two tabs on one
// computer count as two players for testing. The last name typed is shared
// across tabs in localStorage so it can be prefilled.
const PLAYER_ID_KEY = 'ghostwriters.playerId'
const NAME_KEY = 'ghostwriters.name'

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key)
  } catch {
    return null
  }
}

function write(storage: () => Storage, key: string, value: string): void {
  try {
    storage().setItem(key, value)
  } catch {
    // Storage can be blocked (private mode, settings). The app still works,
    // it just won't remember the player after a refresh.
  }
}

// crypto.randomUUID only exists on https or localhost; getRandomValues also
// works when a phone opens the dev server over the local network.
function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

let fallbackId: string | null = null

export function getPlayerId(): string {
  const stored = read(() => sessionStorage, PLAYER_ID_KEY)
  if (stored) return stored
  fallbackId ??= randomId()
  write(() => sessionStorage, PLAYER_ID_KEY, fallbackId)
  return fallbackId
}

export function getSavedName(): string {
  return read(() => localStorage, NAME_KEY) ?? ''
}

export function saveName(name: string): void {
  write(() => localStorage, NAME_KEY, name)
}
