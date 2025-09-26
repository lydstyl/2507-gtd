import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW, setupInstallPrompt } from './utils/pwa'

// Register service worker and setup PWA install prompt
if (import.meta.env.PROD) {
  registerSW()
}
setupInstallPrompt()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
