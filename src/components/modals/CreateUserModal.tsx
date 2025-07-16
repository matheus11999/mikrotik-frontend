/**
 * 🆕 Create User Modal - Modal para criação de novos usuários hotspot
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  Save,
  AlertCircle
} from 'lucide-react'

// Components
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: any) => void
  profiles: Array<{ '.id': string, name: string, 'rate-limit'?: string }>
}

interface FormData {
  username: string
  password: string
  confirmPassword: string
  profile: string
  comment: string
  disabled: boolean
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  profiles
}) => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    profile: '',
    comment: '',
    disabled: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Generate random password
  const generatePassword = () => {
    const password = Math.random().toString(36).substring(2, 12)
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password
    }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Nome deve ter pelo menos 3 caracteres'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Use apenas letras, números, - e _'
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 4) {
      newErrors.password = 'Senha deve ter pelo menos 4 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem'
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
      username: '',
      password: '',
      confirmPassword: '',
      profile: '',
      comment: '',
      disabled: false
    })
    setErrors({})
    setShowPassword(false)
    onClose()
  }

  // Handle input change
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
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
            className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
          >
            <Card className="bg-black border-gray-800 p-0 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Novo Usuário</h2>
                      <p className="text-sm text-gray-400">Criar usuário hotspot</p>
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
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome de Usuário *
                  </label>
                  <Input
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Digite o nome do usuário"
                    className={`bg-gray-900/50 border-gray-700 text-white ${
                      errors.username ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Senha *
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Digite a senha"
                      className={`bg-gray-900/50 border-gray-700 text-white pr-20 ${
                        errors.password ? 'border-red-500' : ''
                      }`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generatePassword}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                        title="Gerar senha"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar Senha *
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirme a senha"
                    className={`bg-gray-900/50 border-gray-700 text-white ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Profile */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Comentário
                  </label>
                  <Input
                    value={formData.comment}
                    onChange={(e) => handleInputChange('comment', e.target.value)}
                    placeholder="Comentário opcional"
                    className="bg-gray-900/50 border-gray-700 text-white"
                  />
                </div>

                {/* Disabled */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="disabled"
                    checked={formData.disabled}
                    onChange={(e) => handleInputChange('disabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="disabled" className="text-sm text-gray-300">
                    Criar usuário desabilitado
                  </label>
                </div>

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
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Criando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Criar Usuário
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

export default CreateUserModal