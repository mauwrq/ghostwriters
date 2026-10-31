import { BOARD_HEIGHT, BOARD_IMAGE, BOARD_WIDTH, REST } from '../game/board'
import { text } from '../text'
import { PLANCHETTE_HEIGHT, PLANCHETTE_IMAGE, PLANCHETTE_SHAPE, PLANCHETTE_WIDTH, WINDOW } from './planchetteShape'
import './OuijaBoard.css'

interface Props {
  // Planchette window position, in board photo pixels.
  x?: number
  y?: number
}

// The talking board: the photo exactly as it is, with the planchette on top.
export function OuijaBoard({ x = REST.x, y = REST.y }: Props) {
  return (
    <svg className="board" viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} role="img" aria-label={text.boardLabel}>
      <defs>
        <clipPath id="planchette-clip">
          <path d={PLANCHETTE_SHAPE} clipRule="evenodd" />
        </clipPath>
        <filter id="planchette-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      <image href={BOARD_IMAGE} width={BOARD_WIDTH} height={BOARD_HEIGHT} />

      <Planchette x={x} y={y} />
    </svg>
  )
}

// How big the planchette photo is drawn on the board. Its window then frames
// one whole letter.
const PLANCHETTE_SCALE = 0.36

function Planchette({ x, y }: { x: number; y: number }) {
  // Everything inside is in the planchette photo's pixels, shifted so the
  // window's center sits at (x, y) on the board.
  const toWindow = `translate(${-WINDOW.x} ${-WINDOW.y})`
  return (
    <g className="planchette" transform={`translate(${x} ${y}) scale(${PLANCHETTE_SCALE})`}>
      {/* It slides flat on the board, so the shadow stays put underneath. */}
      <path
        className="planchette__shadow"
        d={PLANCHETTE_SHAPE}
        fillRule="evenodd"
        filter="url(#planchette-blur)"
        transform={`translate(30 40) ${toWindow}`}
        opacity={0.3}
      />
      <image
        href={PLANCHETTE_IMAGE}
        width={PLANCHETTE_WIDTH}
        height={PLANCHETTE_HEIGHT}
        clipPath="url(#planchette-clip)"
        transform={toWindow}
      />
    </g>
  )
}
