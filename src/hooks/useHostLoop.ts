import { useEffect } from 'react'
import { hasLockIn, isPhaseComplete } from '../game/logic'
import type { Room } from '../game/types'
import { serverNow } from '../lib/firebase'
import { advancePhase, startLockIn } from '../lib/game'

// Runs only in the host's browser: advances the phase when its timer runs out,
// or once everyone is done. Question votes get a short countdown first so
// people can still change their minds.
export function useHostLoop(code: string, room: Room, isHost: boolean): void {
  useEffect(() => {
    if (!isHost || room.phase === 'lobby' || room.phase === 'final') return
    if (isPhaseComplete(room)) {
      if (!hasLockIn(room.phase)) {
        void advancePhase(code, room)
        return
      }
      if (!room.lockingIn) {
        void startLockIn(code, room)
        return
      }
    }
    if (room.phaseEndsAt == null) return
    const timer = setTimeout(() => void advancePhase(code, room), Math.max(0, room.phaseEndsAt - serverNow()))
    return () => clearTimeout(timer)
  }, [code, room, isHost])
}
