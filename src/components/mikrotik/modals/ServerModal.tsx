import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { X, Server, Network } from 'lucide-react'

interface HotspotServer {
  '.id': string
  name: string
  interface?: string
  'address-pool'?: string
  profile?: string
  disabled?: boolean
  comment?: string
}

interface HotspotServerProfile {
  '.id': string
  name: string
  'html-directory'?: string
  'login-page'?: string
  'split-user-domain'?: string
  disabled?: boolean
  comment?: string
}

interface ServerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (serverData: any) => void
  editingServer?: HotspotServer | null
  serverProfiles: HotspotServerProfile[]
  loading?: boolean
}

const ServerModal: React.FC<ServerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingServer,
  serverProfiles,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    interface: '',
    address_pool: '',
    profile: '',
    comment: '',
    disabled: false
  })

  useEffect(() => {
    if (editingServer) {
      setFormData({
        name: editingServer.name || '',
        interface: editingServer.interface || '',
        address_pool: editingServer['address-pool'] || '',
        profile: editingServer.profile || '',
        comment: editingServer.comment || '',
        disabled: editingServer.disabled || false
      })
    } else {
      setFormData({
        name: '',
        interface: '',
        address_pool: '',
        profile: '',
        comment: '',
        disabled: false
      })
    }
  }, [editingServer, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleClose = () => {
    setFormData({
      name: '',
      interface: '',
      address_pool: '',
      profile: '',
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
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              {editingServer ? 'Editar Servidor' : 'Criar Novo Servidor'}
            </h3>
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
              Nome do Servidor *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: hotspot1"
              required
              className="bg-black border-gray-800 text-white"
            />
          </div>

          {/* Interface */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interface
            </label>
            <div className="relative">
              <Network className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                value={formData.interface}
                onChange={(e) => setFormData({ ...formData, interface: e.target.value })}
                placeholder="Ex: bridge, ether1, wlan1"
                className="pl-10 bg-black border-gray-800 text-white"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Interface de rede onde o servidor hotspot será ativo
            </p>
          </div>

          {/* Address Pool */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pool de Endereços
            </label>
            <Input
              type="text"
              value={formData.address_pool}
              onChange={(e) => setFormData({ ...formData, address_pool: e.target.value })}
              placeholder="Ex: dhcp_pool1, static_pool"
              className="bg-black border-gray-800 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pool de IPs que será usado para clientes do hotspot
            </p>
          </div>

          {/* Profile */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Perfil de Servidor
            </label>
            <select
              value={formData.profile}
              onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
              className="w-full bg-black border border-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um perfil</option>
              <option value="default">default</option>
              <option value="hsprof1">hsprof1</option>
              {serverProfiles && serverProfiles.length > 0 ? serverProfiles.map(profile => (
                <option key={profile['.id']} value={profile.name}>
                  {profile.name}
                </option>
              )) : (
                <option disabled>Carregando perfis...</option>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Perfil que define as páginas de login e configurações web
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
              placeholder="Comentário sobre o servidor (opcional)"
              rows={3}
              className="w-full bg-black border border-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="disabled"
              checked={Boolean(formData.disabled)}
              onChange={(e) => setFormData({ ...formData, disabled: e.target.checked })}
              className="rounded border-gray-800 bg-black text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="disabled" className="text-sm text-gray-300">
              Servidor desabilitado
            </label>
          </div>

          {/* Info */}
          <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3">
            <div className="text-xs text-yellow-300">
              <p className="font-medium mb-1">Importante:</p>
              <p>
                Configure a interface e o pool de endereços corretamente antes de ativar o servidor. 
                Certifique-se de que o pool de IPs não conflite com outras configurações de rede.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </div>
              ) : (
                editingServer ? 'Atualizar Servidor' : 'Criar Servidor'
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

export default ServerModal