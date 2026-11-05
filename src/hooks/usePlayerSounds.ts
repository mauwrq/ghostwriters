import { useEffect, useRef } from 'react'
import { sortedPlayers } from '../game/room'
import type { Player } from '../game/types'
import { playJoin, playLeave } from '../lib/sound'

// Plays the join sound when someone else arrives and the leave sound when they
// go. Pass no players outside the lobby to keep it quiet there.
export function usePlayerSounds(players: Record<string, Player> | undefined, playerId: string) {
  const here = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!players) {
      here.current = null
      return
    }
    const others = sortedPlayers(players).filter(([id, p]) => p.connected && id !== playerId)
    const connected = new Set(others.map(([id]) => id))
    const before = here.current
    here.current = connected
    if (!before) return // Whoever's already here when you arrive isn't news.

    if ([...connected].some((id) => !before.has(id))) playJoin()
    else if ([...before].some((id) => !connected.has(id))) playLeave()
  }, [players, playerId])
}
