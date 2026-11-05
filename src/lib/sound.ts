import { BOARD_WIDTH } from '../game/board'
import { MOVE_MS } from '../game/spelling'
import { getSavedVolume, saveVolume, type VolumeKind } from './identity'

const SLIDE_SOUND = '/sounds/planchette-slide.mp3'
const MUSIC = '/sounds/music.mp3'
const JOIN_SOUND = '/sounds/join.mp3'
const LEAVE_SOUND = '/sounds/leave.mp3'
const BLOOPS = '/sounds/bloops.wav'

// The loudest stretch of the recording, in seconds. Each slide plays a piece
// of it, so no two start from the same place.
const SCRAPE_FROM = 0.7
const SCRAPE_TO = 1.7
const LOUDNESS = 1

const PLAYER_SOUND_VOLUME = 0.3

// Typewriter key strikes laid end to end, each in its own slot of the file.
const BLOOP_COUNT = 7
const BLOOP_SECONDS = 0.12
const BLOOP_VOLUME = 0.25

const MUSIC_VOLUME = 0.175
const MUSIC_FADE_SECONDS = 1
// The track ends in three seconds of silence, which would leave a gap each loop.
const MUSIC_LOOP_END = 110.2

let context: AudioContext | null = null
// The player's own sliders. Music and effects each pass through one of these.
const levels = { music: getSavedVolume('music'), sfx: getSavedVolume('sfx') }
const buses: Partial<Record<VolumeKind, GainNode>> = {}
const sounds = new Map<string, AudioBuffer>()
const loading = new Set<string>()

let musicWanted = false
let music: { source: AudioBufferSourceNode; volume: GainNode; startedAt: number } | null = null

function bus(kind: VolumeKind, audio: AudioContext): GainNode {
  const existing = buses[kind]
  if (existing) return existing
  const created = audio.createGain()
  created.gain.value = levels[kind]
  created.connect(audio.destination)
  buses[kind] = created
  return created
}

export function getVolume(kind: VolumeKind): number {
  return levels[kind]
}

export function setVolume(kind: VolumeKind, value: number) {
  levels[kind] = value
  saveVolume(kind, value)
  if (context) bus(kind, context).gain.setTargetAtTime(value, context.currentTime, 0.02)
}

function load(url: string, audio: AudioContext) {
  if (sounds.has(url) || loading.has(url)) return
  loading.add(url)
  fetch(url)
    .then((response) => response.arrayBuffer())
    .then((data) => audio.decodeAudioData(data))
    .then((buffer) => {
      sounds.set(url, buffer)
      syncMusic()
    })
    .catch(() => {}) // No sound is better than a broken game; the next click tries again.
    .finally(() => loading.delete(url))
}

// Browsers keep audio off until the player clicks or types something. Someone
// who refreshes mid-game hears it again from their next click.
function wake() {
  if (!context) {
    context = new AudioContext()
    context.addEventListener('statechange', syncMusic)
  }
  if (context.state === 'suspended') void context.resume()
  for (const url of [SLIDE_SOUND, MUSIC, JOIN_SOUND, LEAVE_SOUND, BLOOPS]) load(url, context)
}

window.addEventListener('pointerdown', wake)
window.addEventListener('keydown', wake)

// One slide of the planchette, distance in board pixels. Longer slides move
// faster in the same time, so they sound higher and louder. A little
// randomness keeps two slides of the same length from matching.
export function playSlide(distance: number) {
  const slideSound = sounds.get(SLIDE_SOUND)
  if (!context || !slideSound || context.state !== 'running') return

  const reach = distance / BOARD_WIDTH
  const rate = 0.8 + 0.5 * reach + (Math.random() - 0.5) * 0.2
  const seconds = MOVE_MS / 1000
  const length = seconds * rate
  const offset = SCRAPE_FROM + Math.random() * (SCRAPE_TO - SCRAPE_FROM - length)

  const source = context.createBufferSource()
  source.buffer = slideSound
  source.playbackRate.value = rate

  // Swells and fades with the planchette, which eases in and out.
  const start = context.currentTime
  const volume = context.createGain()
  volume.gain.setValueAtTime(0, start)
  volume.gain.linearRampToValueAtTime(LOUDNESS * (0.6 + 0.4 * reach), start + seconds * 0.4)
  volume.gain.linearRampToValueAtTime(0, start + seconds)

  source.connect(volume).connect(bus('sfx', context))
  source.start(start, offset, length)
}

function playClip(url: string, level: number, rate = 1, offset = 0, length?: number) {
  const buffer = sounds.get(url)
  if (!context || !buffer || context.state !== 'running') return

  const source = context.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = rate
  const volume = context.createGain()
  volume.gain.value = level
  source.connect(volume).connect(bus('sfx', context))
  source.start(0, offset, length)
}

export function playJoin() {
  playClip(JOIN_SOUND, PLAYER_SOUND_VOLUME)
}

export function playLeave() {
  playClip(LEAVE_SOUND, PLAYER_SOUND_VOLUME)
}

// One key strike, picked at random, pitched down and varied so it sounds like a voice.
export function playBloop() {
  const strike = Math.floor(Math.random() * BLOOP_COUNT)
  const rate = 0.9 + (Math.random() - 0.5) * 0.2
  playClip(BLOOPS, BLOOP_VOLUME, rate, strike * BLOOP_SECONDS, BLOOP_SECONDS)
}

// Starts or fades out the music to match what's wanted, once it's able to play.
function syncMusic() {
  if (!context) return
  const now = context.currentTime

  if (!musicWanted && music) {
    const { source, volume, startedAt } = music
    // gain.value still reads 1 right after the fade-in is scheduled, so work
    // out the level from the fade. React starts and stops the music at once in
    // dev, which would otherwise blast it.
    const level = MUSIC_VOLUME * Math.min(1, (now - startedAt) / MUSIC_FADE_SECONDS)
    volume.gain.cancelScheduledValues(now)
    volume.gain.setValueAtTime(level, now)
    volume.gain.linearRampToValueAtTime(0, now + MUSIC_FADE_SECONDS)
    source.stop(now + MUSIC_FADE_SECONDS)
    music = null
  }

  const buffer = sounds.get(MUSIC)
  if (musicWanted && !music && buffer && context.state === 'running') {
    const source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.loopEnd = MUSIC_LOOP_END

    const volume = context.createGain()
    volume.gain.setValueAtTime(0, now)
    volume.gain.linearRampToValueAtTime(MUSIC_VOLUME, now + MUSIC_FADE_SECONDS)

    source.connect(volume).connect(bus('music', context))
    source.start(now)
    music = { source, volume, startedAt: now }
  }
}

export function startMusic() {
  musicWanted = true
  syncMusic()
}

export function stopMusic() {
  musicWanted = false
  syncMusic()
}
