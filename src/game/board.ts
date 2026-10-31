// Where everything sits on the board photo (public/images/talking-board.jpg),
// in the photo's own pixel coordinates.

export const BOARD_IMAGE = '/images/talking-board.jpg'
export const BOARD_WIDTH = 2000
export const BOARD_HEIGHT = 1493

export interface Spot {
  key: string
  x: number
  y: number
}

// Measured from the photo: the center of each printed letter. The goodbye
// spot is the word FAREWELL on this board.
const POSITIONS: Record<string, [number, number]> = {
  A: [304, 625], B: [410, 526], C: [524, 456], D: [631, 427], E: [753, 386],
  F: [860, 363], G: [974, 356], H: [1113, 360], I: [1213, 372], J: [1305, 394],
  K: [1420, 430], L: [1536, 485], M: [1688, 560],
  N: [325, 930], O: [430, 843], P: [530, 752], Q: [640, 727], R: [754, 674],
  S: [874, 642], T: [983, 632], U: [1102, 635], V: [1236, 650], W: [1383, 692],
  X: [1485, 758], Y: [1614, 818], Z: [1688, 900],
  1: [490, 989], 2: [581, 988], 3: [695, 993], 4: [814, 983], 5: [944, 986],
  6: [1058, 986], 7: [1162, 984], 8: [1270, 980], 9: [1387, 981], 0: [1510, 980],
  YES: [473, 222],
  NO: [1572, 229],
  GOODBYE: [1005, 1212],
}

export const SPOTS: Spot[] = Object.entries(POSITIONS).map(([key, [x, y]]) => ({ key, x, y }))

export const SPOT_BY_KEY = new Map(SPOTS.map((spot) => [spot.key, spot]))

// Where the planchette rests between words: the open space inside the arcs.
export const REST = { x: 1000, y: 810 }
