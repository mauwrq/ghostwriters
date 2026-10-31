// Shapes of the data stored in Firebase under rooms/{CODE}. See PPSPEC.md.

export type Phase = 'lobby' | 'answering' | 'voting' | 'reveal' | 'scores' | 'final'

export interface Player {
  name: string
  color: string
  score: number
  connected: boolean
  joinedAt: number
}

export interface RoundResult {
  winners: string[]
  voteCounts: Record<string, number>
}

export interface Room {
  hostId: string
  createdAt: number
  phase: Phase
  round: number
  totalRounds: number
  phaseEndsAt: number | null
  prompt: string
  players?: Record<string, Player>
  answers?: Record<number, Record<string, string>>
  votes?: Record<number, Record<string, string>>
  results?: Record<number, RoundResult>
}

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 8
export const MAX_NAME_LENGTH = 16
export const MAX_ANSWER_LENGTH = 40
export const DEFAULT_ROUNDS = 4
export const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]
