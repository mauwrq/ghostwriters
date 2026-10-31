import { useEffect } from 'react'
import { isPhaseComplete } from '../game/logic'
import type { Room } from '../game/types'
import { serverNow } from '../lib/firebase'
import { advancePhase } from '../lib/game'

// Runs only in the host's browser: advances the phase when its timer runs out,
// or right away once everyone has answered or voted.
export function useHostLoop(code: string, room: Room, isHost: boolean): void {
  useEffect(() => {
    if (!isHost || room.phase === 'lobby' || room.phase === 'final') return
    if (isPhaseComplete(room)) {
      void advancePhase(code, room)
      return
    }
    if (room.phaseEndsAt == null) return
    const timer = setTimeout(() => void advancePhase(code, room), Math.max(0, room.phaseEndsAt - serverNow()))
    return () => clearTimeout(timer)
  }, [code, room, isHost])
}
