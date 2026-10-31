import { describe, expect, it } from 'vitest'
import {
  canStart,
  cleanName,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  PLAYER_COLORS,
  pickColor,
  pickNextHost,
  sortedPlayers,
} from './room'
import type { Player } from './types'

function player(overrides: Partial<Player> = {}): Player {
  return { name: 'p', color: PLAYER_COLORS[0], score: 0, connected: true, joinedAt: 0, ...overrides }
}

describe('room codes', () => {
  it('generates valid 4-letter codes', () => {
    for (let i = 0; i < 100; i++) expect(isValidRoomCode(generateRoomCode())).toBe(true)
  })

  it('normalizes typed input', () => {
    expect(normalizeRoomCode(' ab-cd9e ')).toBe('ABCD')
  })

  it('rejects codes with I or O', () => {
    expect(isValidRoomCode('ABIO')).toBe(false)
    expect(isValidRoomCode('ABC')).toBe(false)
  })
})

describe('cleanName', () => {
  it('trims, collapses spaces, and caps length', () => {
    expect(cleanName('  Casper   the  ghost  ')).toBe('Casper the ghost')
    expect(cleanName('a'.repeat(30))).toHaveLength(16)
    expect(cleanName('   ')).toBe('')
  })
})

describe('players', () => {
  it('sorts by join time and skips nameless records', () => {
    const players = {
      b: player({ name: 'B', joinedAt: 2 }),
      a: player({ name: 'A', joinedAt: 1 }),
      ghost: { connected: false } as Player,
    }
    expect(sortedPlayers(players).map(([id]) => id)).toEqual(['a', 'b'])
  })

  it('picks the first unused color', () => {
    const players = { a: player({ color: PLAYER_COLORS[0] }), b: player({ color: PLAYER_COLORS[2] }) }
    expect(pickColor(players)).toBe(PLAYER_COLORS[1])
    expect(pickColor({})).toBe(PLAYER_COLORS[0])
  })

  it('returns no color when all are taken', () => {
    const players = Object.fromEntries(PLAYER_COLORS.map((color, i) => [`p${i}`, player({ color })]))
    expect(pickColor(players)).toBeUndefined()
  })

  it('needs 3 connected players to start', () => {
    const two = { a: player(), b: player(), c: player({ connected: false }) }
    expect(canStart(two)).toBe(false)
    expect(canStart({ ...two, d: player() })).toBe(true)
  })
})

describe('pickNextHost', () => {
  const players = {
    host: player({ joinedAt: 1 }),
    second: player({ joinedAt: 2 }),
    third: player({ joinedAt: 3 }),
  }

  it('keeps a connected host', () => {
    expect(pickNextHost(players, 'host')).toBeNull()
  })

  it('promotes the earliest connected player when the host drops', () => {
    expect(pickNextHost({ ...players, host: player({ joinedAt: 1, connected: false }) }, 'host')).toBe('second')
  })

  it('promotes when the host left the room entirely', () => {
    expect(pickNextHost({ second: players.second, third: players.third }, 'host')).toBe('second')
  })
})
