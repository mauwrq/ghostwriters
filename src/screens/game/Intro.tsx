import { text } from '../../text'

// How to play. Everyone sees it at once, right after the host starts the game.
export function Intro() {
  return (
    <section className="panel intro">
      <h2 className="intro__title">{text.introTitle}</h2>
      <ol className="intro__steps">
        {text.introSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  )
}
