// The questions asked of the spirit, each with the sentence its winning
// answer fills in for the story at the end. In a story sentence, {spirit} is
// the spirit's name (the winning answer to the first question) and {answer}
// is the winning answer to this question.

export interface Prompt {
  question: string
  story: string
}

// Always the first question; its winning answer names the spirit.
export const NAME_PROMPT: Prompt = {
  question: 'Spirit, what is your name?',
  story: 'The group spoke with {spirit}.',
}

// Always the last question.
export const GOODBYE_PROMPT: Prompt = {
  question: 'Spirit, before you go, what is your warning to us?',
  story: 'By the end, {spirit} warned the players: {answer}.',
}

// The questions in between, picked on the question board. Add more here;
// they don't repeat within a game unless the game has more rounds than prompts.
export const PROMPTS: Prompt[] = [
  { question: 'Spirit, how did you die?', story: '{spirit} died {answer}.' },
  { question: "Spirit, what's your biggest regret?", story: "{spirit}'s biggest regret was {answer}." },
  { question: "Spirit, what's in the attic?", story: 'In the attic, there was {answer}.' },
  { question: 'Spirit, rate my outfit', story: "{spirit} rated the group's outfits: {answer}." },
]

// For questions the players wrote themselves.
export const CUSTOM_STORY = 'When asked "{question}", {spirit} said "{answer}".'

// What to call the spirit if the first question got no answer.
export const NAMELESS_SPIRIT = 'a nameless spirit'
