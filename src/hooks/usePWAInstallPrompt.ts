import { useEffect, useState, useCallback } from 'react'

interface InstallPrompt {
  prompt: () => Promise<void>
}

export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e as InstallPrompt)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    setDeferredPrompt(null)
    setIsInstallable(false)
  }, [deferredPrompt])

  return { isInstallable, promptInstall }
} 