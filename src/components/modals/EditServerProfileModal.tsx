/**
 * 🛠️ Edit Server Profile Modal
 * 
 * Modal para edição de Server Profiles do MikroTik
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Save, 
  Loader2, 
  Settings,
  Globe,
  Shield,
  Wifi,
  AlertCircle
} from 'lucide-react'

// Components
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { useToast } from '../ui/toast'

interface ServerProfile {
  '.id': string
  name: string
  'hotspot-address'?: string
  'dns-name'?: string
  'html-directory'?: string
  'http-proxy'?: string
  'login-by'?: string
  'use-radius'?: string
  'nas-identifier'?: string
  'nas-port-type'?: string
  'accounting'?: string
  disabled?: string
}

interface EditServerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: ServerProfile
  onSave: (profileData: any) => Promise<void>
  loading?: boolean
}

const EditServerProfileModal: React.FC<EditServerProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  loading = false
}) => {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    'hotspot-address': '',
    'dns-name': '',
    'html-directory': '',
    'http-proxy': '',
    'login-by': '',
    'use-radius': '',
    'nas-identifier': '',
    'nas-port-type': '',
    'accounting': '',
    disabled: false
  })
  const [saving, setSaving] = useState(false)

  // Load profile data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        name: profile.name || '',
        'hotspot-address': profile['hotspot-address'] || '',
        'dns-name': profile['dns-name'] || '',
        'html-directory': profile['html-directory'] || '',
        'http-proxy': profile['http-proxy'] || '',
        'login-by': profile['login-by'] || '',
        'use-radius': profile['use-radius'] || '',
        'nas-identifier': profile['nas-identifier'] || '',
        'nas-port-type': profile['nas-port-type'] || '',
        'accounting': profile['accounting'] || '',
        disabled: profile.disabled === 'true'
      })
    }
  }, [isOpen, profile])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validate required fields
      if (!formData.name.trim()) {
        addToast({
          type: 'error',
          title: 'Erro de validação',
          description: 'Nome é obrigatório'
        })
        return
      }

      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        disabled: formData.disabled ? 'true' : 'false'
      }

      // Add optional fields only if they have values
      if (formData['hotspot-address']) apiData['hotspot-address'] = formData['hotspot-address']
      if (formData['dns-name']) apiData['dns-name'] = formData['dns-name']
      if (formData['html-directory']) apiData['html-directory'] = formData['html-directory']
      if (formData['http-proxy']) apiData['http-proxy'] = formData['http-proxy']
      if (formData['login-by']) apiData['login-by'] = formData['login-by']
      if (formData['use-radius']) apiData['use-radius'] = formData['use-radius']
      if (formData['nas-identifier']) apiData['nas-identifier'] = formData['nas-identifier']
      if (formData['nas-port-type']) apiData['nas-port-type'] = formData['nas-port-type']
      if (formData['accounting']) apiData['accounting'] = formData['accounting']

      await onSave(apiData)
      onClose()
      
      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'Server profile atualizado com sucesso'
      })
    } catch (error) {
      console.error('Error saving server profile:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao salvar server profile: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSwitchChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-black border border-gray-800/50 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Editar Server Profile</h3>
                <p className="text-sm text-gray-400">Modifique as configurações do server profile</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Informações Básicas
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm text-gray-300">
                    Nome *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome do server profile"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="hotspot-address" className="text-sm text-gray-300">
                    Endereço Hotspot
                  </Label>
                  <Input
                    id="hotspot-address"
                    value={formData['hotspot-address']}
                    onChange={(e) => handleInputChange('hotspot-address', e.target.value)}
                    placeholder="ex: 192.168.1.1"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="dns-name" className="text-sm text-gray-300">
                    Nome DNS
                  </Label>
                  <Input
                    id="dns-name"
                    value={formData['dns-name']}
                    onChange={(e) => handleInputChange('dns-name', e.target.value)}
                    placeholder="ex: hotspot.exemplo.com"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="html-directory" className="text-sm text-gray-300">
                    Diretório HTML
                  </Label>
                  <Input
                    id="html-directory"
                    value={formData['html-directory']}
                    onChange={(e) => handleInputChange('html-directory', e.target.value)}
                    placeholder="ex: /flash/mikropix"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Network Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Configurações de Rede
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="http-proxy" className="text-sm text-gray-300">
                    Proxy HTTP
                  </Label>
                  <Input
                    id="http-proxy"
                    value={formData['http-proxy']}
                    onChange={(e) => handleInputChange('http-proxy', e.target.value)}
                    placeholder="ex: 192.168.1.1:8080"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="login-by" className="text-sm text-gray-300">
                    Login Por
                  </Label>
                  <Input
                    id="login-by"
                    value={formData['login-by']}
                    onChange={(e) => handleInputChange('login-by', e.target.value)}
                    placeholder="ex: username,mac"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>
              </div>
            </div>

            {/* RADIUS Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Configurações RADIUS
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="use-radius" className="text-sm text-gray-300">
                    Usar RADIUS
                  </Label>
                  <Input
                    id="use-radius"
                    value={formData['use-radius']}
                    onChange={(e) => handleInputChange('use-radius', e.target.value)}
                    placeholder="ex: yes/no"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="nas-identifier" className="text-sm text-gray-300">
                    Identificador NAS
                  </Label>
                  <Input
                    id="nas-identifier"
                    value={formData['nas-identifier']}
                    onChange={(e) => handleInputChange('nas-identifier', e.target.value)}
                    placeholder="Identificador NAS"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="nas-port-type" className="text-sm text-gray-300">
                    Tipo de Porta NAS
                  </Label>
                  <Input
                    id="nas-port-type"
                    value={formData['nas-port-type']}
                    onChange={(e) => handleInputChange('nas-port-type', e.target.value)}
                    placeholder="ex: wireless"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="accounting" className="text-sm text-gray-300">
                    Contabilização
                  </Label>
                  <Input
                    id="accounting"
                    value={formData['accounting']}
                    onChange={(e) => handleInputChange('accounting', e.target.value)}
                    placeholder="ex: yes/no"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Status
              </h4>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="disabled"
                  checked={formData.disabled}
                  onCheckedChange={(checked) => handleSwitchChange('disabled', checked)}
                />
                <Label htmlFor="disabled" className="text-sm text-gray-300">
                  Desabilitado
                </Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-800/50">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default EditServerProfileModal