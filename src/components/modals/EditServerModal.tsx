/**
 * 🖥️ Edit Server Modal
 * 
 * Modal para edição de Servidores Hotspot do MikroTik
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Save, 
  Loader2, 
  Server,
  Network,
  Shield,
  Globe,
  AlertCircle,
  Activity
} from 'lucide-react'

// Components
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { useToast } from '../ui/toast'

interface HotspotServer {
  '.id': string
  name: string
  interface?: string
  'address-pool'?: string
  profile?: string
  'ip-of-dns-name'?: string
  'addresses-per-mac'?: string
  disabled?: string
  invalid?: string
}

interface EditServerModalProps {
  isOpen: boolean
  onClose: () => void
  server: HotspotServer
  onSave: (serverData: any) => Promise<void>
  loading?: boolean
}

const EditServerModal: React.FC<EditServerModalProps> = ({
  isOpen,
  onClose,
  server,
  onSave,
  loading = false
}) => {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    interface: '',
    'address-pool': '',
    profile: '',
    'ip-of-dns-name': '',
    'addresses-per-mac': '',
    disabled: false
  })
  const [saving, setSaving] = useState(false)

  // Load server data when modal opens
  useEffect(() => {
    if (isOpen && server) {
      setFormData({
        name: server.name || '',
        interface: server.interface || '',
        'address-pool': server['address-pool'] || '',
        profile: server.profile || '',
        'ip-of-dns-name': server['ip-of-dns-name'] || '',
        'addresses-per-mac': server['addresses-per-mac'] || '',
        disabled: server.disabled === 'true'
      })
    }
  }, [isOpen, server])

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

      if (!formData.interface.trim()) {
        addToast({
          type: 'error',
          title: 'Erro de validação',
          description: 'Interface é obrigatória'
        })
        return
      }

      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        interface: formData.interface.trim(),
        disabled: formData.disabled ? 'true' : 'false'
      }

      // Add optional fields only if they have values
      if (formData['address-pool']) apiData['address-pool'] = formData['address-pool']
      if (formData.profile) apiData['profile'] = formData.profile
      if (formData['ip-of-dns-name']) apiData['ip-of-dns-name'] = formData['ip-of-dns-name']
      if (formData['addresses-per-mac']) apiData['addresses-per-mac'] = formData['addresses-per-mac']

      await onSave(apiData)
      onClose()
      
      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'Servidor atualizado com sucesso'
      })
    } catch (error) {
      console.error('Error saving server:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao salvar servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
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
              <div className="p-2 bg-green-600/20 rounded-lg">
                <Server className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Editar Servidor</h3>
                <p className="text-sm text-gray-400">Modifique as configurações do servidor hotspot</p>
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
                <Server className="h-4 w-4" />
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
                    placeholder="Nome do servidor"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="interface" className="text-sm text-gray-300">
                    Interface *
                  </Label>
                  <Input
                    id="interface"
                    value={formData.interface}
                    onChange={(e) => handleInputChange('interface', e.target.value)}
                    placeholder="ex: ether1, wlan1"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="profile" className="text-sm text-gray-300">
                    Profile
                  </Label>
                  <Input
                    id="profile"
                    value={formData.profile}
                    onChange={(e) => handleInputChange('profile', e.target.value)}
                    placeholder="ex: default"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="address-pool" className="text-sm text-gray-300">
                    Pool de Endereços
                  </Label>
                  <Input
                    id="address-pool"
                    value={formData['address-pool']}
                    onChange={(e) => handleInputChange('address-pool', e.target.value)}
                    placeholder="ex: dhcp-pool"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Network Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Network className="h-4 w-4" />
                Configurações de Rede
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ip-of-dns-name" className="text-sm text-gray-300">
                    IP ou Nome DNS
                  </Label>
                  <Input
                    id="ip-of-dns-name"
                    value={formData['ip-of-dns-name']}
                    onChange={(e) => handleInputChange('ip-of-dns-name', e.target.value)}
                    placeholder="ex: 192.168.1.1 ou dns.exemplo.com"
                    className="bg-black/40 border-gray-800/50 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="addresses-per-mac" className="text-sm text-gray-300">
                    Endereços por MAC
                  </Label>
                  <Input
                    id="addresses-per-mac"
                    value={formData['addresses-per-mac']}
                    onChange={(e) => handleInputChange('addresses-per-mac', e.target.value)}
                    placeholder="ex: 2"
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

export default EditServerModal