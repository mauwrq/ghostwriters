// Every piece of on-screen wording, so it can all be edited in one place.
export const text = {
  title: 'Ghostwriters',

  namePlaceholder: 'your name',
  codePlaceholder: 'room code',
  join: 'join room',
  create: 'create room',

  players: 'players',
  roomCode: 'room code',
  rounds: 'rounds',
  inviteLink: 'invite link',
  copy: 'copy',
  copied: 'copied',
  start: 'start game',
  needPlayers: (min: number) => `need ${min} players to start`,
  waitingForHost: 'waiting for the host to start',
  leave: 'leave',
  you: 'you',
  host: 'host',
  loading: 'loading',

  errors: {
    noName: 'enter a name',
    badCode: 'enter a 4-letter room code',
    'not-found': 'room not found',
    full: 'room is full',
    'in-progress': 'game already started',
    'no-code': 'could not create a room, try again',
    'not-configured': 'firebase is not configured',
    generic: 'something went wrong, try again',
    roomClosed: 'that room is gone',
  },
}
