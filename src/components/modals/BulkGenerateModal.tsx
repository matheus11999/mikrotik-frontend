/**
 * 👥 Bulk Generate Modal - Modal para geração em massa de usuários
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  UserPlus, 
  Users, 
  AlertCircle,
  Hash,
  CreditCard,
  Zap
} from 'lucide-react'

// Components
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface BulkGenerateModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (generateData: any) => void
  profiles: Array<{ 
    '.id': string
    name: string
    'rate-limit'?: string
    'session-timeout'?: string
    price?: number
  }>
}

interface FormData {
  quantity: number
  profile: string
}

const BulkGenerateModal: React.FC<BulkGenerateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  profiles
}) => {
  const [formData, setFormData] = useState<FormData>({
    quantity: 10,
    profile: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Get selected profile details
  const selectedProfile = profiles.find(p => p.name === formData.profile)

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Quantidade deve ser pelo menos 1'
    } else if (formData.quantity > 500) {
      newErrors.quantity = 'Quantidade máxima é 500 usuários'
    }

    if (!formData.profile) {
      newErrors.profile = 'Selecione um plano'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const confirmMessage = `Tem certeza que deseja gerar ${formData.quantity} usuários?\n\nPlano: ${formData.profile}\nFormato: Números de 5 dígitos\n\nEsta ação não pode ser desfeita.`
    
    if (!confirm(confirmMessage)) return

    setSubmitting(true)
    try {
      await onSubmit(formData)
      handleClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle close
  const handleClose = () => {
    setFormData({
      quantity: 10,
      profile: ''
    })
    setErrors({})
    onClose()
  }

  // Handle input change
  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          >
            <Card className="bg-black border-gray-800 p-0 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-b border-gray-800 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <UserPlus className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Geração em Massa</h2>
                      <p className="text-sm text-gray-400">Criar múltiplos usuários automaticamente</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Hash className="h-4 w-4 inline mr-1" />
                    Quantidade de Usuários *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    placeholder="Ex: 50"
                    className={`bg-gray-900/50 border-gray-700 text-white ${
                      errors.quantity ? 'border-red-500' : ''
                    }`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.quantity ? (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.quantity}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-xs">
                        Mínimo: 1 • Máximo: 500 usuários
                      </p>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {formData.quantity} usuário{formData.quantity !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>


                {/* Profile */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Zap className="h-4 w-4 inline mr-1" />
                    Plano (Profile) *
                  </label>
                  <select
                    value={formData.profile}
                    onChange={(e) => handleInputChange('profile', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                      errors.profile ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Selecione um plano</option>
                    {profiles.map((profile) => (
                      <option key={profile['.id']} value={profile.name}>
                        {profile.name} {profile['rate-limit'] ? `(${profile['rate-limit']})` : ''}
                        {profile.price ? ` - R$ ${profile.price.toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.profile && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.profile}
                    </p>
                  )}
                </div>

                {/* Selected Profile Details */}
                {selectedProfile && (
                  <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Detalhes do Plano Selecionado
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nome:</span>
                        <span className="text-white">{selectedProfile.name}</span>
                      </div>
                      {selectedProfile['rate-limit'] && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Velocidade:</span>
                          <span className="text-white">{selectedProfile['rate-limit']}</span>
                        </div>
                      )}
                      {selectedProfile['session-timeout'] && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tempo de Sessão:</span>
                          <span className="text-white">{selectedProfile['session-timeout']}</span>
                        </div>
                      )}
                      {selectedProfile.price && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Valor por usuário:</span>
                          <span className="text-green-400">R$ {selectedProfile.price.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedProfile.price && (
                        <div className="flex justify-between border-t border-gray-700 pt-2">
                          <span className="text-gray-400">Total estimado:</span>
                          <span className="text-green-400 font-medium">
                            R$ {(selectedProfile.price * formData.quantity).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={submitting || !formData.profile || !formData.quantity}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Gerando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Gerar {formData.quantity} Usuários
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default BulkGenerateModal