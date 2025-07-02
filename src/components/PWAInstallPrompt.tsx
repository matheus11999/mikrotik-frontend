import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Smartphone, Monitor, Zap } from 'lucide-react'
import { usePWAInstallPrompt } from '../hooks/usePWAInstallPrompt'

export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWAInstallPrompt()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Verifica se o usuário já dispensou o prompt
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    // Mostra o prompt após 10 segundos se for instalável
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [isInstallable])

  const handleInstall = async () => {
    try {
      await promptInstall()
      setShowPrompt(false)
    } catch (error) {
      console.error('Erro ao instalar PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!isInstallable || dismissed) return null

  return (
    <>
      {/* Prompt Banner (mobile/tablet) */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-gray-800/50 backdrop-blur-sm md:hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Instalar MikroPix
                    </h3>
                    <p className="text-xs text-gray-400">
                      Acesso rápido na tela inicial
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleInstall}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Instalar
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Detalhado (desktop) */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm hidden md:flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-black/90 border border-gray-800/50 rounded-2xl p-8 max-w-md w-full backdrop-blur-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Instalar MikroPix
                    </h2>
                    <p className="text-sm text-gray-400">
                      Aplicativo Web Progressivo
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Benefícios */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Acesso Ultra-Rápido
                    </h3>
                    <p className="text-xs text-gray-400">
                      Carregamento instantâneo mesmo offline
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Experiência Nativa
                    </h3>
                    <p className="text-xs text-gray-400">
                      Interface dedicada sem distrações
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Ícone na Área de Trabalho
                    </h3>
                    <p className="text-xs text-gray-400">
                      Acesso direto como um app nativo
                    </p>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex space-x-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar Agora</span>
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="px-6 py-3 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl transition-all duration-200"
                >
                  Agora Não
                </button>
              </div>

              {/* Nota */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Este prompt só aparece uma vez. Você pode instalar depois através do menu do navegador.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}