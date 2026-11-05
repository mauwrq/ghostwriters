// Shapes of the data stored in Firebase under rooms/{CODE}.

export type Phase =
  | 'lobby'
  | 'intro' // how to play, shown once before the first round
  | 'promptVote' // pick this round's question, or add one to the board
  | 'answering'
  | 'seance' // the board spells out every answer, anonymously
  | 'voting'
  | 'reveal'
  | 'scores'
  | 'final'

export interface Player {
  name: string
  // Which ghost pattern this player has (0 to MAX_PLAYERS - 1), unique in the room.
  look: number
  score: number
  connected: boolean
  joinedAt: number
}

// Firebase drops empty arrays and objects, so every field can be missing.
export interface RoundResult {
  winners?: string[]
  voteCounts?: Record<string, number>
  // Set when too few people answered to hold a vote.
  skipped?: boolean
}

// The question asked in a round, kept for the credits.
export interface RoundPrompt {
  question: string
}

// A question a player added to the board, and when, so every device lists
// them in the same order.
export interface AskedQuestion {
  text: string
  at: number
}

export interface Room {
  hostId: string
  createdAt: number
  phase: Phase
  round: number
  totalRounds: number
  phaseEndsAt: number | null
  prompt: string
  // When the current game started; tells one game apart from the next.
  gameStartedAt?: number
  // Indexes into PROMPTS already used this game, so none repeat.
  usedPrompts?: number[]
  // Indexes into PROMPTS shown on the board this round.
  promptOptions?: number[]
  // True during the short countdown after everyone has voted on a question.
  lockingIn?: boolean
  players?: Record<string, Player>
  // Per round: what each player voted for on the question board
  // (a PROMPTS index as a string, or the author of a written question).
  promptVotes?: Record<number, Record<string, string>>
  // Per round: questions players wrote, by author.
  questions?: Record<number, Record<string, AskedQuestion>>
  answers?: Record<number, Record<string, string>>
  votes?: Record<number, Record<string, string>>
  results?: Record<number, RoundResult>
  roundPrompts?: Record<number, RoundPrompt>
}

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 8
export const MAX_NAME_LENGTH = 16
export const MAX_ANSWER_LENGTH = 40
export const MAX_QUESTION_LENGTH = 80
export const DEFAULT_ROUNDS = 2
export const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]
