// Shapes of the data stored in Firebase under rooms/{CODE}.

export type Phase =
  | 'lobby'
  | 'promptVote' // pick this round's question from the board
  | 'questionWrite' // the custom option won: everyone writes a question
  | 'questionVote' // pick which written question to ask
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

// The question asked in a round, and the story sentence its winning answer
// fills in (none for questions the players wrote themselves).
export interface RoundPrompt {
  question: string
  story?: string
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
  // (a PROMPTS index as a string, or CUSTOM_OPTION).
  promptVotes?: Record<number, Record<string, string>>
  // Per round: questions players wrote, and their votes (author IDs).
  questions?: Record<number, Record<string, string>>
  questionVotes?: Record<number, Record<string, string>>
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
export const DEFAULT_ROUNDS = 4
export const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]
