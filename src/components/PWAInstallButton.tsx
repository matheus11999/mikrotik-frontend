import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Smartphone, ExternalLink, Info } from 'lucide-react'
import { usePWAInstallPrompt } from '../hooks/usePWAInstallPrompt'
import { Button } from './ui/button'

interface PWAInstallButtonProps {
  collapsed?: boolean
}

export function PWAInstallButton({ collapsed = false }: PWAInstallButtonProps) {
  const { isInstallable, promptInstall } = usePWAInstallPrompt()
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  // Debug logs
  useEffect(() => {
    console.log('[PWA-DEBUG] Button rendered:', { isInstallable, isInstalled })
  }, [isInstallable, isInstalled])

  // Verifica se PWA já está instalado
  useEffect(() => {
    const checkIfInstalled = () => {
      // Verifica se está rodando como PWA
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppMode = (window.navigator as any).standalone === true
      const isPWAMode = isInStandaloneMode || isInWebAppMode
      
      console.log('[PWA-DEBUG] Installation check:', { 
        isInStandaloneMode, 
        isInWebAppMode, 
        isPWAMode,
        userAgent: navigator.userAgent.substring(0, 100)
      })
      
      setIsInstalled(isPWAMode)
    }

    checkIfInstalled()
  }, [])

  const handleInstall = async () => {
    console.log('[PWA-DEBUG] Install button clicked:', { isInstallable, isInstalled })
    
    if (isInstalled) {
      // Se já está instalado, mostra info
      alert('O aplicativo já está instalado! Você está usando a versão PWA.')
      return
    }

    if (!isInstallable) {
      // Se não é instalável, mostra instruções manuais
      const userAgent = navigator.userAgent.toLowerCase()
      let instruction = ''
      
      if (userAgent.includes('chrome')) {
        instruction = 'No Chrome: Menu (⋮) → "Instalar aplicativo" ou "Adicionar à tela inicial"'
      } else if (userAgent.includes('firefox')) {
        instruction = 'No Firefox: Menu → "Instalar" ou adicione aos favoritos'
      } else if (userAgent.includes('safari')) {
        instruction = 'No Safari: Botão de compartilhar → "Adicionar à Tela de Início"'
      } else {
        instruction = 'Use as opções do seu navegador para adicionar este site à tela inicial'
      }
      
      alert(`PWA não detectado automaticamente.\n\n${instruction}`)
      return
    }
    
    try {
      setIsInstalling(true)
      console.log('[PWA-DEBUG] Calling promptInstall...')
      await promptInstall()
      console.log('[PWA-DEBUG] Install completed successfully')
    } catch (error) {
      console.error('[PWA-DEBUG] Install error:', error)
      alert('Erro ao instalar: ' + (error as Error).message)
    } finally {
      setIsInstalling(false)
    }
  }

  // Sempre mostra o botão para debug
  const getButtonState = () => {
    if (isInstalling) return { text: 'Instalando...', icon: Download, variant: 'outline' as const }
    if (isInstalled) return { text: 'App Instalado', icon: Smartphone, variant: 'outline' as const }
    if (isInstallable) return { text: 'Instalar App', icon: Download, variant: 'outline' as const }
    return { text: 'Instalar App', icon: ExternalLink, variant: 'ghost' as const }
  }

  const buttonState = getButtonState()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Button
        onClick={handleInstall}
        disabled={isInstalling}
        variant={buttonState.variant}
        size={collapsed ? "icon" : "sm"}
        className={`
          w-full transition-all duration-200 group
          ${isInstalled 
            ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20' 
            : isInstallable
            ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
            : 'border-gray-500/50 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
          }
          ${collapsed ? 'p-2' : 'justify-start gap-3 px-3 py-2'}
        `}
        onDoubleClick={() => setShowDebug(!showDebug)}
      >
        <motion.div
          animate={isInstalling ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 1, repeat: isInstalling ? Infinity : 0, ease: "linear" }}
          className="flex-shrink-0"
        >
          <buttonState.icon className="h-4 w-4" />
        </motion.div>
        
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">
              {buttonState.text}
            </span>
            {showDebug && (
              <Info className="h-3 w-3 opacity-60" />
            )}
          </div>
        )}
      </Button>
      
      {/* Debug info (duplo clique para ativar) */}
      {showDebug && !collapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 p-2 bg-gray-900/50 rounded text-xs text-gray-400 font-mono"
        >
          <div>Installable: {isInstallable ? '✅' : '❌'}</div>
          <div>Installed: {isInstalled ? '✅' : '❌'}</div>
          <div>Standalone: {window.matchMedia('(display-mode: standalone)').matches ? '✅' : '❌'}</div>
        </motion.div>
      )}
    </motion.div>
  )
}