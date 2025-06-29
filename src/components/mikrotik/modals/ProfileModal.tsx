import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { X, DollarSign, Info, Settings, Clock, Zap, Database } from 'lucide-react'

interface HotspotProfile {
  '.id': string
  name: string
  'rate-limit'?: string
  'session-timeout'?: string
  'idle-timeout'?: string
  valor?: number
  disabled?: boolean
  comment?: string
  inDatabase?: boolean
  supabaseId?: string
}

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (profileData: any) => void
  editingProfile?: HotspotProfile | null
  loading?: boolean
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProfile,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    valor: '',
    rate_limit: '',
    session_timeout: '',
    idle_timeout: '',
    comment: '',
    disabled: false
  })

  useEffect(() => {
    if (editingProfile) {
      setFormData({
        name: editingProfile.name || '',
        valor: editingProfile.valor?.toString() || '',
        rate_limit: editingProfile['rate-limit'] || '',
        session_timeout: editingProfile['session-timeout'] || '',
        idle_timeout: editingProfile['idle-timeout'] || '',
        comment: editingProfile.comment || '',
        disabled: editingProfile.disabled || false
      })
    } else {
      setFormData({
        name: '',
        valor: '',
        rate_limit: '',
        session_timeout: '',
        idle_timeout: '',
        comment: '',
        disabled: false
      })
    }
  }, [editingProfile, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Preserve the sync status and database ID when submitting
    const submitData = {
      ...formData,
      inDatabase: editingProfile?.inDatabase,
      supabaseId: editingProfile?.supabaseId,
      mikrotikId: editingProfile?.['.id']
    }
    onSubmit(submitData)
  }

  const handleClose = () => {
    setFormData({
      name: '',
      valor: '',
      rate_limit: '',
      session_timeout: '',
      idle_timeout: '',
      comment: '',
      disabled: false
    })
    onClose()
  }



  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-purple-400" />
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-white">
                {editingProfile ? 'Editar Plano' : 'Criar Novo Plano'}
              </h3>
              {editingProfile?.inDatabase && (
                <div className="flex items-center gap-1 mt-1">
                  <Database className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Plano Sincronizado</span>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="border-gray-600 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Plano *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: 1 Hora - 10MB"
              required
              className="bg-black border-gray-700 text-white"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valor (R$) *
            </label>
            <div className="relative">
              <DollarSign className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0.00"
                required
                className="pl-10 bg-black border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Rate Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Limite de Velocidade
            </label>
            <div className="relative">
              <Zap className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                value={formData.rate_limit}
                onChange={(e) => setFormData({ ...formData, rate_limit: e.target.value })}
                placeholder="Ex: 1M/1M (upload/download)"
                className="pl-10 bg-black border-gray-700 text-white"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Formato: upload/download (Ex: 1M/5M, 512k/1M)
            </p>
          </div>

          {/* Session Timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tempo de Sessão
            </label>
            <div className="relative">
              <Clock className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                value={formData.session_timeout}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  session_timeout: e.target.value
                })}
                placeholder="Ex: 3600 (segundos), 1h, 60m"
                className="pl-10 bg-black border-gray-700 text-white"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Em segundos ou formato MikroTik (1h, 60m, 3600s)
            </p>
          </div>

          {/* Idle Timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Timeout de Inatividade
            </label>
            <div className="relative">
              <Clock className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                value={formData.idle_timeout}
                onChange={(e) => setFormData({ ...formData, idle_timeout: e.target.value })}
                placeholder="Ex: 300 (segundos), 5m"
                className="pl-10 bg-black border-gray-700 text-white"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tempo para desconectar por inatividade
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comentário
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Comentário sobre o plano (opcional)"
              rows={3}
              className="w-full bg-black border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="disabled"
              checked={Boolean(formData.disabled)}
              onChange={(e) => setFormData({ ...formData, disabled: e.target.checked })}
              className="rounded border-gray-700 bg-black text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="disabled" className="text-sm text-gray-300">
              Plano desabilitado
            </label>
          </div>

          {/* Info */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Dica:</p>
                <p>
                  Planos com valor serão salvos no banco de dados automaticamente. 
                  Isso permitirá rastreamento de vendas e estatísticas.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.valor}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </div>
              ) : (
                editingProfile ? 'Atualizar Plano' : 'Criar Plano'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 border-gray-600 text-gray-300 hover:text-white"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileModal