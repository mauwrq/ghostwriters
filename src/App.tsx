import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db, isFirebaseConfigured } from './lib/firebase'
import './App.css'

type Status = 'not-configured' | 'connecting' | 'connected' | 'disconnected'

function App() {
  const [status, setStatus] = useState<Status>(
    isFirebaseConfigured ? 'connecting' : 'not-configured',
  )

  // ".info/connected" is a special Firebase path that is true while this
  // browser has a live connection to the database.
  useEffect(() => {
    if (!db) return
    return onValue(ref(db, '.info/connected'), (snap) => {
      setStatus(snap.val() === true ? 'connected' : 'disconnected')
    })
  }, [])

  return (
    <main className="home">
      <h1 className="home__title">Ghostwriters</h1>
      <p className="home__tagline">firebase connection test</p>
      <p className={`status status--${status}`}>Firebase: {status}</p>
    </main>
  )
}

export default App
