import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { Viewer } from './components/Viewer.tsx'
import './index.css'

// ?viewer opens the standalone model viewer (orbit the collectibles)
const isViewer = new URLSearchParams(window.location.search).has('viewer')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isViewer ? <Viewer /> : <App />}</StrictMode>,
)
