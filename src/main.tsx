import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BoardTest } from './screens/BoardTest.tsx'

// ?board opens the planchette test page instead of the game.
const showBoardTest = new URLSearchParams(location.search).has('board')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{showBoardTest ? <BoardTest /> : <App />}</StrictMode>,
)
