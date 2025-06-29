import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { X, Database, Folder, Globe, Info } from 'lucide-react'

interface HotspotServerProfile {
  '.id': string
  name: string
  'html-directory'?: string
  'login-page'?: string
  'login-by'?: string
  'split-user-domain'?: string
  disabled?: boolean
  comment?: string
}

interface ServerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (profileData: any) => void
  editingServerProfile?: HotspotServerProfile | null
  loading?: boolean
}

const ServerProfileModal: React.FC<ServerProfileModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingServerProfile,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    html_directory: '/flash/mikropix',
    login_page: 'login.html',
    login_by: 'http-chap,http-pap',
    split_user_domain: 'no',
    comment: '',
    disabled: false
  })

  useEffect(() => {
    if (editingServerProfile) {
      setFormData({
        name: editingServerProfile.name || '',
        html_directory: editingServerProfile['html-directory'] || '/flash/mikropix',
        login_page: editingServerProfile['login-page'] || 'login.html',
        login_by: editingServerProfile['login-by'] || 'http-chap,http-pap',
        split_user_domain: editingServerProfile['split-user-domain'] || 'no',
        comment: editingServerProfile.comment || '',
        disabled: editingServerProfile.disabled || false
      })
    } else {
      setFormData({
        name: '',
        html_directory: '/flash/mikropix',
        login_page: 'login.html',
        login_by: 'http-chap,http-pap',
        split_user_domain: 'no',
        comment: '',
        disabled: false
      })
    }
  }, [editingServerProfile, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleClose = () => {
    setFormData({
      name: '',
      html_directory: '/flash/mikropix',
      login_page: 'login.html',
      login_by: 'http-chap,http-pap',
      split_user_domain: 'no',
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
            <Database className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              {editingServerProfile ? 'Editar Perfil de Servidor' : 'Criar Novo Perfil de Servidor'}
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
              Nome do Perfil *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: default-hsprof, custom-login"
              required
              className="bg-black border-gray-800 text-white"
            />
          </div>

          {/* HTML Directory */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Diretório HTML
            </label>
            <div className="relative">
              <Folder className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                value={formData.html_directory}
                onChange={(e) => setFormData({ ...formData, html_directory: e.target.value })}
                placeholder="Ex: /flash/mikropix, hotspot"
                className="pl-10 bg-black border-gray-800 text-white"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Diretório onde estão os arquivos HTML customizados do hotspot
            </p>
          </div>

          {/* Login Page */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Página de Login
            </label>
            <div className="relative">
              <Globe className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                value={formData.login_page}
                onChange={(e) => setFormData({ ...formData, login_page: e.target.value })}
                placeholder="Ex: login.html, index.html"
                className="pl-10 bg-black border-gray-800 text-white"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Nome do arquivo HTML que será usado como página de login
            </p>
          </div>

          {/* Login By */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Métodos de Login
            </label>
            <select
              value={formData.login_by}
              onChange={(e) => setFormData({ ...formData, login_by: e.target.value })}
              className="w-full bg-black border border-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="http-chap,http-pap">HTTP CHAP e PAP</option>
              <option value="http-chap">Apenas HTTP CHAP</option>
              <option value="http-pap">Apenas HTTP PAP</option>
              <option value="https">HTTPS</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Métodos de autenticação permitidos para o hotspot
            </p>
          </div>

          {/* Split User Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dividir Domínio do Usuário
            </label>
            <select
              value={formData.split_user_domain}
              onChange={(e) => setFormData({ ...formData, split_user_domain: e.target.value })}
              className="w-full bg-black border border-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="no">Não</option>
              <option value="yes">Sim</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Permite usar usuários no formato user@domain
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
              placeholder="Comentário sobre o perfil de servidor (opcional)"
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
              Perfil desabilitado
            </label>
          </div>

          {/* Info */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Dica sobre HTML Directory:</p>
                <p>
                  O diretório HTML deve conter os arquivos de interface do hotspot. 
                  Se não especificado, será usado o diretório padrão do RouterOS. 
                  Certifique-se de que os arquivos estejam no diretório correto do MikroTik.
                </p>
              </div>
            </div>
          </div>

          {/* Custom HTML Directory Info */}
          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
            <div className="text-xs text-green-300">
              <p className="font-medium mb-1">Exemplo de estrutura de diretório:</p>
              <div className="bg-gray-800 rounded p-2 mt-2 font-mono">
                <p>/flash/hotspot/</p>
                <p>├── login.html</p>
                <p>├── status.html</p>
                <p>├── logout.html</p>
                <p>└── style.css</p>
              </div>
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
                editingServerProfile ? 'Atualizar Perfil' : 'Criar Perfil'
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

export default ServerProfileModal