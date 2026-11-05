// The questions asked of the spirit.

export interface Prompt {
  question: string
}

// Always the first question.
export const NAME_PROMPT: Prompt = {
  question: 'Can you spell your name?',
}

// Always the last question.
export const GOODBYE_PROMPT: Prompt = {
  question: 'Any last words before we say goodbye?',
}

// The questions in between, picked on the question board. Add more here;
// they don't repeat within a game unless the game has more rounds than prompts.
export const PROMPTS: Prompt[] = [
  { question: 'How did you die?' },
  { question: "What's your biggest regret?" },
  { question: "What is after death?" },
  { question: "Do you want to be friends?" },
  { question: "Why are you here?" },
  { question: "Does death hurt?" },
  { question: "Do you have a ghost crush?" },
  { question: "Are you a ghost?" },
  { question: "What do you do on weekends?" },
  { question: "Which of us is going to die first?" },
  { question: "Is someone you loved still alive?" },
  { question: "What do you miss most about being alive?" },
  { question: "When did you die?" },
  { question: "Are you lonely?" },
  { question: "Who are you following home tonight?" },
  { question: "What should we tell the living?" },
  
]
