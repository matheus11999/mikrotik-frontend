import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalFooter } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { 
  Key, 
  Users, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  generatePasswordBatch, 
  formatGenerationSummary,
  estimateCreationTime,
  formatEstimatedTime,
  PASSWORD_GENERATION_LIMITS,
  type PasswordGenerationConfig,
  type GeneratedUser
} from '../../utils/passwordGenerator'

interface HotspotProfile {
  '.id': string
  name: string
  'rate-limit'?: string
  valor?: number
}

interface GeneratePasswordsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profiles: HotspotProfile[]
  existingUsers: string[]
  onGenerate: (users: GeneratedUser[]) => Promise<void>
}

export default function GeneratePasswordsModal({ 
  open, 
  onOpenChange, 
  profiles, 
  existingUsers, 
  onGenerate 
}: GeneratePasswordsModalProps) {
  const [config, setConfig] = useState<PasswordGenerationConfig>({
    quantity: 10,
    profile: profiles[0]?.name || 'default'
  })
  
  const [step, setStep] = useState<'config' | 'generating' | 'completed'>('config')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedUsers, setGeneratedUsers] = useState<GeneratedUser[]>([])
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('config')
      setIsGenerating(false)
      setProgress(0)
      setGeneratedUsers([])
      setError(null)
      setConfig({
        quantity: 10,
        profile: profiles[0]?.name || 'default'
      })
    }
  }, [open, profiles])

  const handleGenerate = async () => {
    try {
      setError(null)
      setIsGenerating(true)
      setStep('generating')
      setProgress(0)

      // Encontrar o perfil selecionado para obter o valor
      const selectedProfile = profiles.find(p => p.name === config.profile)
      const configWithValue = {
        ...config,
        valor: selectedProfile?.valor || 0
      }

      // Gerar usuários localmente
      const result = generatePasswordBatch(configWithValue, existingUsers)
      
      if (result.errors.length > 0) {
        console.warn('Erros na geração:', result.errors)
      }

      // Se nenhum usuário foi gerado, exibir erro e abortar
      if (result.users.length === 0) {
        setError(result.errors.length > 0 ? result.errors.join('\n') : 'Nenhum usuário gerado. Verifique as configurações.')
        setStep('config')
        return
      }

      setGeneratedUsers(result.users)

      // Simular progresso
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15 + 5
        setProgress(Math.min(currentProgress, 90))
      }, 300)

      // Criar no MikroTik
      await onGenerate(result.users)

      clearInterval(interval)
      setProgress(100)
      setStep('completed')
      
    } catch (error) {
      console.error('Erro ao gerar senhas:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      setStep('config')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false)
    }
  }

  const estimatedTime = estimateCreationTime(config.quantity)

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Gerar Senhas em Lote"
      description="Configure e gere múltiplas senhas de acesso para o hotspot"
      size="md"
      closeOnOverlayClick={!isGenerating}
    >
      <ModalContent>
        <AnimatePresence mode="wait">
          {step === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Quantidade */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Quantidade de Senhas
                </label>
                <Input
                  type="number"
                  min={PASSWORD_GENERATION_LIMITS.MIN_QUANTITY}
                  max={PASSWORD_GENERATION_LIMITS.MAX_QUANTITY}
                  value={config.quantity}
                  onChange={(e) => setConfig({ ...config, quantity: parseInt(e.target.value) || 1 })}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="Quantidade"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Mínimo: {PASSWORD_GENERATION_LIMITS.MIN_QUANTITY} | Máximo: {PASSWORD_GENERATION_LIMITS.MAX_QUANTITY}
                </p>
              </div>

              {/* Perfil */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Perfil do Hotspot
                </label>
                <select
                  value={config.profile}
                  onChange={(e) => setConfig({ ...config, profile: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {profiles.map((profile) => (
                    <option key={profile['.id']} value={profile.name}>
                      {profile.name} {profile.valor && `- R$ ${profile.valor.toFixed(2)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimativa */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Estimativa</span>
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>• Tempo estimado: {formatEstimatedTime(estimatedTime)}</p>
                  <p>• {config.quantity} senhas serão criadas</p>
                  <p>• Perfil: {config.profile}</p>
                  <p>• Valor: R$ {profiles.find(p => p.name === config.profile)?.valor?.toFixed(2) || '0,00'}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-300">{error}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Gerando senhas...
                </h3>
                <p className="text-gray-400">
                  Criando {config.quantity} usuários no MikroTik
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <p className="text-sm text-gray-400">
                {progress.toFixed(0)}% concluído
              </p>
            </motion.div>
          )}

          {step === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="bg-green-500/20 rounded-full p-4">
                  <CheckCircle className="h-16 w-16 text-green-400" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Senhas geradas com sucesso!
                </h3>
                <p className="text-gray-400">
                  {generatedUsers.length} usuários foram criados no MikroTik
                </p>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-300 space-y-1">
                  <p>✅ {generatedUsers.length} senhas criadas</p>
                  <p>✅ Perfil: {config.profile}</p>
                  <p>✅ Prontas para uso</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalContent>

      <ModalFooter>
        {step === 'config' && (
          <>
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || config.quantity < 1 || config.quantity > PASSWORD_GENERATION_LIMITS.MAX_QUANTITY}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Key className="h-4 w-4 mr-2" />
              Gerar Senhas
            </Button>
          </>
        )}

        {step === 'generating' && (
          <Button
            variant="outline"
            disabled
            className="w-full"
          >
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Gerando...
          </Button>
        )}

        {step === 'completed' && (
          <Button
            onClick={handleClose}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Concluído
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
} 