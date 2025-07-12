import { useEffect, useState, useCallback } from 'react'

// Tipagem completa do evento antes da instalação
interface InstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// --- CAPTURA GLOBAL ---------------------------------------------------------
//  Armazena o evento logo que o bundle é carregado, evitando perder o prompt
let savedPrompt: InstallPrompt | null = null
let globalListenerAdded = false

if (typeof window !== 'undefined' && !globalListenerAdded) {
  console.log('[PWA-HOOK] Setting up global beforeinstallprompt listener')
  
  window.addEventListener('beforeinstallprompt', (e: any) => {
    console.log('[PWA-HOOK] beforeinstallprompt event captured globally:', e)
    e.preventDefault()
    savedPrompt = e as InstallPrompt
  })
  
  // Log adicional para debug
  console.log('[PWA-HOOK] Global listener added. Current state:', {
    userAgent: navigator.userAgent.substring(0, 100),
    isHTTPS: location.protocol === 'https:',
    hasServiceWorker: 'serviceWorker' in navigator,
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
    isEdge: /Edg/.test(navigator.userAgent),
    isMobile: /Mobile|Android|iP(ad|od|hone)/.test(navigator.userAgent)
  })
  
  globalListenerAdded = true
}

// --- HOOK -------------------------------------------------------------------
export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(savedPrompt)
  const [isInstallable, setIsInstallable] = useState<boolean>(!!savedPrompt)

  useEffect(() => {
    console.log('[PWA-HOOK] Hook initialized. Initial state:', { 
      hasPrompt: !!savedPrompt, 
      isInstallable: !!savedPrompt 
    })

    // Handler para capturar novos eventos durante a execução
    const handler = (e: any) => {
      console.log('[PWA-HOOK] beforeinstallprompt event captured in hook:', e)
      e.preventDefault()
      savedPrompt = e as InstallPrompt
      setDeferredPrompt(savedPrompt)
      setIsInstallable(true)
    }

    // Handler para quando app é instalado
    const installedHandler = () => {
      console.log('[PWA-HOOK] App was installed')
      savedPrompt = null
      setDeferredPrompt(null)
      setIsInstallable(false)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    // Verifica periodicamente se o prompt está disponível
    const checkInterval = setInterval(() => {
      if (savedPrompt && !isInstallable) {
        console.log('[PWA-HOOK] Prompt found in periodic check')
        setDeferredPrompt(savedPrompt)
        setIsInstallable(true)
      }
    }, 1000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
      clearInterval(checkInterval)
    }
  }, [isInstallable])

  const promptInstall = useCallback(async () => {
    console.log('[PWA-HOOK] promptInstall called:', { 
      hasPrompt: !!deferredPrompt, 
      isInstallable 
    })
    
    if (!deferredPrompt) {
      console.warn('[PWA-HOOK] No deferred prompt available')
      throw new Error('PWA não está disponível para instalação automática')
    }

    try {
      console.log('[PWA-HOOK] Calling prompt()')
      await deferredPrompt.prompt()
      
      console.log('[PWA-HOOK] Waiting for user choice')
      const choiceResult = await deferredPrompt.userChoice
      console.log('[PWA-HOOK] User choice result:', choiceResult)
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA-HOOK] User accepted the install prompt')
      } else {
        console.log('[PWA-HOOK] User dismissed the install prompt')
      }
      
      // Limpa o prompt após uso
      savedPrompt = null
      setDeferredPrompt(null)
      setIsInstallable(false)
      
    } catch (error) {
      console.error('[PWA-HOOK] Error during installation:', error)
      throw error
    }
  }, [deferredPrompt, isInstallable])

  return { 
    isInstallable, 
    promptInstall,
    deferredPrompt: !!deferredPrompt
  }
} 