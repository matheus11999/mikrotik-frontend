import { useEffect, useState, useCallback } from 'react'

// Tipagem mínima do evento antes da instalação
interface InstallPrompt {
  prompt: () => Promise<void>
}

// --- CAPTURA GLOBAL ---------------------------------------------------------
//  Armazena o evento logo que o bundle é carregado, evitando perder o prompt
let savedPrompt: InstallPrompt | null = null
if (typeof window !== 'undefined' && !(window as any)._mikropixPWAListenerAdded) {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault()
    savedPrompt = e as InstallPrompt
  })
  // Evita adicionar o listener mais de uma vez em hot reload
  ;(window as any)._mikropixPWAListenerAdded = true
}

// --- HOOK -------------------------------------------------------------------
export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(savedPrompt)
  const [isInstallable, setIsInstallable] = useState<boolean>(!!savedPrompt)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      savedPrompt = e as InstallPrompt
      setDeferredPrompt(savedPrompt)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    savedPrompt = null
    setDeferredPrompt(null)
    setIsInstallable(false)
  }, [deferredPrompt])

  return { isInstallable, promptInstall }
} 