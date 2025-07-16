/**
 * ✏️ Edit User Modal - Modal para edição de usuários hotspot
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Edit, 
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

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: any) => void
  user: any
  profiles: Array<{ '.id': string, name: string, 'rate-limit'?: string }>
}

interface FormData {
  password: string
  confirmPassword: string
  profile: string
  comment: string
  disabled: boolean
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  profiles
}) => {
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
    profile: '',
    comment: '',
    disabled: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [changePassword, setChangePassword] = useState(false)

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        password: '',
        confirmPassword: '',
        profile: user.profile || '',
        comment: user.comment || '',
        disabled: user.disabled === 'true' || user.disabled === true
      })
      setChangePassword(false)
      setErrors({})
    }
  }, [user])

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

    if (changePassword) {
      if (!formData.password) {
        newErrors.password = 'Senha é obrigatória'
      } else if (formData.password.length < 4) {
        newErrors.password = 'Senha deve ter pelo menos 4 caracteres'
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não coincidem'
      }
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
      const updateData: any = {
        profile: formData.profile,
        comment: formData.comment,
        disabled: formData.disabled
      }

      if (changePassword && formData.password) {
        updateData.password = formData.password
      }

      await onSubmit(updateData)
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
      password: '',
      confirmPassword: '',
      profile: '',
      comment: '',
      disabled: false
    })
    setErrors({})
    setShowPassword(false)
    setChangePassword(false)
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

  if (!user) return null

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
              <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-gray-800 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600/20 rounded-lg">
                      <Edit className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Editar Usuário</h2>
                      <p className="text-sm text-gray-400">Editando: {user.name}</p>
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
                {/* Username (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome de Usuário
                  </label>
                  <Input
                    value={user.name}
                    disabled
                    className="bg-gray-800/50 border-gray-700 text-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O nome de usuário não pode ser alterado
                  </p>
                </div>

                {/* Change Password Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="changePassword"
                    checked={changePassword}
                    onChange={(e) => {
                      setChangePassword(e.target.checked)
                      if (!e.target.checked) {
                        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))
                        setErrors(prev => ({ ...prev, password: '', confirmPassword: '' }))
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="changePassword" className="text-sm text-gray-300">
                    Alterar senha
                  </label>
                </div>

                {/* Password Fields (only if changePassword is true) */}
                {changePassword && (
                  <>
                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nova Senha *
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Digite a nova senha"
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
                        Confirmar Nova Senha *
                      </label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirme a nova senha"
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
                  </>
                )}

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
                    Usuário desabilitado
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
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Salvar Alterações
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

export default EditUserModal