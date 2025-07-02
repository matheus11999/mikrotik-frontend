import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Registra Service Worker gerado pelo vite-plugin-pwa
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  }).catch(console.error)
}

createRoot(document.getElementById('root')!).render(
  <App />
)
