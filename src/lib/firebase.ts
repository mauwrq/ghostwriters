import { initializeApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'

// Values come from .env.local (see .env.example). Vite only exposes
// variables that start with VITE_ to browser code.
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
