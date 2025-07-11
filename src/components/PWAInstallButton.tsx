import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Smartphone } from 'lucide-react'
import { usePWAInstallPrompt } from '../hooks/usePWAInstallPrompt'
import { Button } from './ui/button'

interface PWAInstallButtonProps {
  collapsed?: boolean
}

export function PWAInstallButton({ collapsed = false }: PWAInstallButtonProps) {
  const { isInstallable, promptInstall } = usePWAInstallPrompt()
  const [isInstalling, setIsInstalling] = useState(false)

  const handleInstall = async () => {
    if (!isInstallable) return
    
    try {
      setIsInstalling(true)
      await promptInstall()
    } catch (error) {
      console.error('Erro ao instalar PWA:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  if (!isInstallable) return null

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
        variant="outline"
        size={collapsed ? "icon" : "sm"}
        className={`
          w-full border-blue-500/50 bg-blue-500/10 text-blue-400 
          hover:bg-blue-500/20 hover:border-blue-400 hover:text-blue-300
          transition-all duration-200 group
          ${collapsed ? 'p-2' : 'justify-start gap-3 px-3 py-2'}
        `}
      >
        <motion.div
          animate={isInstalling ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 1, repeat: isInstalling ? Infinity : 0, ease: "linear" }}
          className="flex-shrink-0"
        >
          <Download className="h-4 w-4" />
        </motion.div>
        
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">
              {isInstalling ? 'Instalando...' : 'Instalar App'}
            </span>
            <Smartphone className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </Button>
    </motion.div>
  )
}