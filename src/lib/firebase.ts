import { initializeApp } from 'firebase/app'
import { getDatabase, onValue, ref, type Database } from 'firebase/database'

// Values come from .env.local. Vite only exposes variables that start with
// VITE_ to browser code.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.databaseURL)

export const db: Database | null = isFirebaseConfigured
  ? getDatabase(initializeApp(config))
  : null

// Firebase reports how far this device's clock is from the server's, so
// timestamps from different devices can be compared.
let serverOffset = 0
if (db) {
  onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
    serverOffset = snap.val() ?? 0
  })
}

export function serverNow(): number {
  return Date.now() + serverOffset
}
