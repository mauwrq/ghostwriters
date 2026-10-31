import { text } from '../text'

export function Logo({ small = false }: { small?: boolean }) {
  return <h1 className={small ? 'logo logo--small' : 'logo'}>{text.title}</h1>
}
