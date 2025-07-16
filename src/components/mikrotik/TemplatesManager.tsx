/**
 * 🎨 Templates Manager
 * 
 * Gerenciador de Templates do Captive Portal
 * Sistema completo de aplicação de templates via script RouterOS
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Layout, 
  Search, 
  Eye, 
  Settings, 
  RefreshCw,
  Upload,
  Palette,
  Play,
  Folder,
  FileText,
  X,
  Loader2
} from 'lucide-react'

// Components
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { useToast } from '../ui/toast'

interface TemplatesManagerProps {
  mikrotikId: string
  mikrotikName: string
  session: any
  baseUrl: string
  headers: Record<string, string>
  onRefresh?: () => void
}

interface Template {
  id: string
  name: string
  description: string
  preview: string
  variables: Array<{
    key: string
    label: string
    type: string
    required: boolean
    default?: string
  }>
  files: string[]
  folders: string[]
}

interface ServerProfile {
  '.id': string
  name: string
}

const TemplatesManager: React.FC<TemplatesManagerProps> = ({
  mikrotikId,
  mikrotikName,
  session,
  baseUrl,
  headers,
  onRefresh
}) => {
  const { addToast } = useToast()

  // States
  const [templates, setTemplates] = useState<Template[]>([])
  const [serverProfiles, setServerProfiles] = useState<ServerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [selectedServerProfile, setSelectedServerProfile] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [applying, setApplying] = useState(false)

  // Predefined templates (now consuming from backend)
  const predefinedTemplates: Template[] = [
    {
      id: 'template1',
      name: 'Template Básico',
      description: 'Template limpo e simples com gradiente azul',
      preview: 'http://router.mikropix.online:3001/api/mikrotik/templates/template1/preview',
      variables: [
        { key: 'PRIMARY_COLOR', label: 'Cor Primária', type: 'color', required: false, default: '#3b82f6' },
        { key: 'LOGO_ICON', label: 'Ícone do Logo', type: 'text', required: false },
        { key: 'WELCOME_TITLE', label: 'Título de Boas-vindas', type: 'text', required: false },
        { key: 'WELCOME_MESSAGE', label: 'Mensagem de Boas-vindas', type: 'text', required: false },
        { key: 'DEBUG_MODE', label: 'Modo Debug', type: 'select', required: false, default: 'false' }
      ],
      files: ['login.html', 'alogin.html', 'error.html', 'rlogin.html', 'logout.html', 'styles.css', 'script.js', 'md5.js', 'favicon.ico', 'preview.png', 'api.json', 'errors.txt'],
      folders: ['xml']
    },
    {
      id: 'template2',
      name: 'Template Mobile',
      description: 'Otimizado para dispositivos móveis',
      preview: 'http://router.mikropix.online:3001/api/mikrotik/templates/template2/preview',
      variables: [
        { key: 'PROVIDER_NAME', label: 'Nome do Provedor', type: 'text', required: true },
        { key: 'LOGO_URL', label: 'URL do Logo', type: 'url', required: false },
        { key: 'PRIMARY_COLOR', label: 'Cor Primária', type: 'color', required: false, default: '#3b82f6' },
        { key: 'WELCOME_MESSAGE', label: 'Mensagem de Boas-vindas', type: 'text', required: false },
        { key: 'DEBUG_MODE', label: 'Modo Debug', type: 'select', required: false, default: 'false' }
      ],
      files: ['login.html', 'alogin.html', 'rlogin.html', 'styles.css', 'script.js', 'md5.js', 'favicon.ico', 'preview.png', 'errors.txt'],
      folders: []
    }
  ]

  // Fetch server profiles
  const fetchServerProfiles = useCallback(async () => {
    if (!mikrotikId || !session) return

    try {
      const response = await fetch(`http://router.mikropix.online:3001/api/mikrotik/${mikrotikId}/rest/ip/hotspot/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || (session as any)?.session?.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const profilesData = data.success && data.data ? data.data : (Array.isArray(data) ? data : [])
      setServerProfiles(profilesData)
      
    } catch (error) {
      console.error('[TemplatesManager] Error fetching server profiles:', error)
    }
  }, [mikrotikId, session])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (mikrotikId && baseUrl && session) {
        setLoading(true)
        try {
          setTemplates(predefinedTemplates)
          await fetchServerProfiles()
        } finally {
          setLoading(false)
        }
      }
    }

    loadData()
  }, [mikrotikId, baseUrl, session, fetchServerProfiles])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchServerProfiles()
      addToast({
        type: 'success',
        title: 'Atualizado!',
        description: 'Templates atualizados com sucesso'
      })
    } finally {
      setRefreshing(false)
    }
  }, [fetchServerProfiles, addToast])

  // Filter templates
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle template selection
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template)
    
    // Initialize variables with defaults
    const initialVariables: Record<string, string> = {}
    template.variables.forEach(variable => {
      if (variable.default) {
        initialVariables[variable.key] = variable.default
      }
      if (variable.key === 'PROVIDER_NAME') {
        initialVariables[variable.key] = mikrotikName
      }
    })
    
    setTemplateVariables(initialVariables)
    setShowModal(true)
  }


  // Handle apply template
  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !selectedServerProfile) return

    // Validate required variables
    const missingRequired = selectedTemplate.variables
      .filter(v => v.required && !templateVariables[v.key])
      .map(v => v.label)

    if (missingRequired.length > 0) {
      addToast({
        type: 'error',
        title: 'Campos obrigatórios',
        description: `Preencha: ${missingRequired.join(', ')}`
      })
      return
    }

    setApplying(true)
    try {
      console.log('[TemplatesManager] *** NOVO CÓDIGO *** Applying template:', selectedTemplate.id, 'to MikroTik:', mikrotikId)
      console.log('[TemplatesManager] mikrotikId type:', typeof mikrotikId, 'value:', mikrotikId)
      console.log('[TemplatesManager] selectedServerProfile:', selectedServerProfile)
      console.log('[TemplatesManager] templateVariables:', templateVariables)
      
      const applyUrl = `http://router.mikropix.online:3001/api/mikrotik/templates/apply`
      console.log('[TemplatesManager] Using URL:', applyUrl)
      
      const requestBody = {
        mikrotikId: mikrotikId,
        serverProfileId: selectedServerProfile,
        templateId: selectedTemplate.id,
        variables: templateVariables
      }
      
      console.log('[TemplatesManager] Request body:', JSON.stringify(requestBody, null, 2))
      
      // Usar o endpoint /templates/apply que já está implementado
      const applyResponse = await fetch(applyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || (session as any)?.session?.access_token}`
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!applyResponse.ok) {
        const errorData = await applyResponse.json()
        throw new Error(errorData.error || `HTTP ${applyResponse.status}: ${applyResponse.statusText}`)
      }
      
      const result = await applyResponse.json()
      console.log('[TemplatesManager] Template applied successfully:', result)
      
      addToast({
        type: 'success',
        title: 'Template aplicado!',
        description: 'Template foi aplicado com sucesso ao server profile'
      })
      
      setShowModal(false)
      setSelectedTemplate(null)
      setTemplateVariables({})
      setSelectedServerProfile('')
      
    } catch (error) {
      console.error('[TemplatesManager] Error applying template:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Falha ao aplicar template: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    } finally {
      setApplying(false)
    }
  }

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedTemplate(null)
    setTemplateVariables({})
    setSelectedServerProfile('')
  }

  // Render variable input
  const renderVariableInput = (variable: any) => {
    const value = templateVariables[variable.key] || ''
    
    switch (variable.type) {
      case 'color':
        return (
          <div className="flex gap-2">
            <Input
              type="color"
              value={value}
              onChange={(e) => setTemplateVariables(prev => ({
                ...prev,
                [variable.key]: e.target.value
              }))}
              className="w-12 h-10 p-1 rounded bg-black/40 border-gray-800/50"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => setTemplateVariables(prev => ({
                ...prev,
                [variable.key]: e.target.value
              }))}
              placeholder={variable.default || '#000000'}
              className="flex-1 bg-black/40 border-gray-800/50 text-white"
            />
          </div>
        )
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setTemplateVariables(prev => ({
              ...prev,
              [variable.key]: e.target.value
            }))}
            className="w-full p-2 bg-black/40 border border-gray-800/50 rounded text-white"
          >
            <option value="false">Não</option>
            <option value="true">Sim</option>
          </select>
        )
      default:
        return (
          <Input
            type={variable.type}
            value={value}
            onChange={(e) => setTemplateVariables(prev => ({
              ...prev,
              [variable.key]: e.target.value
            }))}
            placeholder={variable.default || `Digite ${variable.label.toLowerCase()}`}
            required={variable.required}
            className="bg-black/40 border-gray-800/50 text-white"
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-700/30 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-700/30 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-black/40 border border-gray-800/50 rounded-2xl p-6 animate-pulse">
              <div className="h-32 bg-gray-700/30 rounded mb-4"></div>
              <div className="h-6 bg-gray-700/30 rounded mb-2"></div>
              <div className="h-4 bg-gray-700/30 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Templates do Captive Portal</h2>
          <p className="text-gray-400">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template disponível' : 'templates disponíveis'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-black/40 border-gray-800/50 text-white"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black/40 border-gray-800/50 overflow-hidden hover:border-blue-500/50 transition-all duration-300 group">
              {/* Preview */}
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                <img 
                  src={template.preview} 
                  alt={`Preview ${template.name}`}
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    // Hide fallback when image loads
                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-content')
                    if (fallback) fallback.style.display = 'none'
                  }}
                  onError={(e) => {
                    // Show fallback if image fails to load
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-content')
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px] opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="text-center">
                    <Eye className="h-8 w-8 text-white mx-auto mb-2" />
                    <p className="text-sm text-white font-medium">Preview</p>
                  </div>
                </div>
                {/* Fallback content */}
                <div className="fallback-content absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Layout className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Preview</p>
                    <p className="text-xs text-gray-600">{template.name}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* Template Info */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    <span>{template.variables.length} variáveis</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{template.files.length} arquivos</span>
                  </div>
                  {template.folders.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Folder className="h-4 w-4" />
                      <span>{template.folders.length} pasta{template.folders.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Aplicar Template
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3"
                    onClick={() => {
                      addToast({
                        type: 'info',
                        title: 'Preview',
                        description: 'Funcionalidade de preview será implementada em breve'
                      })
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Template Configuration Modal */}
      <AnimatePresence>
        {showModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-black border border-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Palette className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Configurar Template</h3>
                    <p className="text-sm text-gray-400">{selectedTemplate.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Server Profile Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Server Profile de Destino *
                  </label>
                  <select
                    value={selectedServerProfile}
                    onChange={(e) => setSelectedServerProfile(e.target.value)}
                    className="w-full p-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white"
                    required
                  >
                    <option value="">Selecione um server profile</option>
                    {serverProfiles.map(profile => (
                      <option key={profile['.id']} value={profile['.id']}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Template Variables */}
                {selectedTemplate.variables.map(variable => (
                  <div key={variable.key}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {variable.label} {variable.required && '*'}
                    </label>
                    {renderVariableInput(variable)}
                  </div>
                ))}

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleCloseModal}
                    disabled={applying}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleApplyTemplate}
                    disabled={!selectedServerProfile || applying}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {applying ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Aplicando...
                      </div>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Aplicar Template
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TemplatesManager