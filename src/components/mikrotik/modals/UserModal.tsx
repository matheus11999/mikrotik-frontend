import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { X, User, Lock, Info } from 'lucide-react'

interface HotspotUser {
  '.id': string
  name: string
  password?: string
  profile?: string
  comment?: string
  disabled?: boolean
}

interface HotspotProfile {
  '.id': string
  name: string
  'rate-limit'?: string
  valor?: number
}

interface HotspotServer {
  '.id': string
  name: string
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: any) => void
  editingUser?: HotspotUser | null
  profiles: HotspotProfile[]
  servers?: HotspotServer[]
  loading?: boolean
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
  profiles,
  servers = [],
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    profile: '',
    server: '',
    comment: '',
    disabled: false
  })

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        password: editingUser.password || '',
        profile: editingUser.profile || '',
        server: (editingUser as any).server || '',
        comment: editingUser.comment || '',
        disabled: editingUser.disabled || false
      })
    } else {
      setFormData({
        name: '',
        password: '',
        profile: '',
        server: '',
        comment: '',
        disabled: false
      })
    }
  }, [editingUser, isOpen, profiles, servers])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleClose = () => {
    setFormData({
      name: '',
      password: '',
      profile: '',
      server: '',
      comment: '',
      disabled: false
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:scale-110"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6">

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Usuário *
            </label>
            <div className="relative">
              <User className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome do usuário"
                required
                className="pl-10 bg-black border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Senha {!editingUser && '*'}
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? "Deixe vazio para não alterar" : "Digite a senha"}
                required={!editingUser}
                className="pl-10 bg-black border-gray-700 text-white"
              />
            </div>
            {editingUser && (
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio para manter a senha atual
              </p>
            )}
          </div>

          {/* Profile */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Plano/Perfil *
            </label>
            <select
              value={formData.profile}
              onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
              className="w-full bg-black border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um plano</option>
              <option value="default">default</option>
              {profiles && profiles.length > 0 ? profiles.map(profile => (
                <option key={profile['.id']} value={profile.name}>
                  {profile.name}
                  {profile['rate-limit'] && ` - ${profile['rate-limit']}`}
                  {profile.valor && profile.valor > 0 && ` (R$ ${profile.valor.toFixed(2)})`}
                </option>
              )) : (
                <option disabled>Carregando planos...</option>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Selecione o plano que define velocidade e limites para este usuário
            </p>
          </div>

          {/* Server */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Servidor Hotspot
            </label>
            <select
              value={formData.server}
              onChange={(e) => setFormData({ ...formData, server: e.target.value })}
              className="w-full bg-black border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Auto (usar primeiro servidor disponível)</option>
              {servers && servers.length > 0 ? servers.map(server => (
                <option key={server['.id']} value={server.name}>
                  {server.name}
                </option>
              )) : (
                <option disabled>Nenhum servidor configurado</option>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Deixe vazio para usar automaticamente o primeiro servidor disponível
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
              placeholder="Digite um comentário (opcional)"
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
              className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="disabled" className="text-sm text-gray-300">
              Usuário desabilitado
            </label>
          </div>

          {/* Info */}
          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-300">
                <p className="font-medium mb-1">💡 Dicas:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Use nomes únicos para cada usuário</li>
                  <li>Selecione um plano para definir velocidade e limites</li>
                  <li>Senhas são obrigatórias para novos usuários</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-800">
            <Button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-lg transition-all duration-300 hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </div>
              ) : (
                editingUser ? 'Atualizar Usuário' : 'Criar Usuário'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 hover:bg-gray-800 transition-all duration-300 hover:scale-105"
            >
              Cancelar
            </Button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserModal