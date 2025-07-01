import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import './hooks/usePWAInstallPrompt'

// Registra Service Worker gerado pelo vite-plugin-pwa
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <App />
)
