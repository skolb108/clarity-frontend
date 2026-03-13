import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// CSS import removed from here.
// index.css is now loaded via <link rel="preload"> in index.html using the
// onload swap trick so it never blocks first paint.
// Vite handles hashing and serving in both dev and production.
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
