import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Globe, 
  Palette, 
  FileImage, 
  Save, 
  Upload, 
  Eye,
  Tag,
  FileText,
  Search,
  Key
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { useToast } from '../../components/ui/toast'
import { useAuthContext } from '../../contexts/AuthContext'
import { useSystemSettings } from '../../contexts/SystemSettingsContext'
import { supabase } from '../../lib/supabase'

interface SystemSettings {
  site_name: string
  site_description: string
  site_keywords: string
  site_url: string
  favicon_url: string
  logo_url: string
  primary_color: string
  secondary_color: string
  meta_title: string
  meta_description: string
  updated_at?: string
  updated_by?: string
}

export function SystemSettings() {
  const { user } = useAuthContext()
  const { addToast } = useToast()
  const { refreshSettings } = useSystemSettings()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    site_name: 'MikroPix',
    site_description: 'Sistema completo de gestão para MikroTik, hotspots e infraestrutura de rede.',
    site_keywords: 'mikrotik, hotspot, provedor, internet, wifi, routeros, gestão, rede',
    site_url: 'https://mikropix.online',
    favicon_url: '/img/logo-white.png',
    logo_url: '/img/logo-white.png',
    primary_color: '#3b82f6',
    secondary_color: '#1f2937',
    meta_title: 'MikroPix - Sistema de Gestão MikroTik',
    meta_description: 'Sistema completo de gestão para MikroTik e infraestrutura de rede com templates personalizáveis e monitoramento em tempo real.'
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Erro ao carregar configurações do sistema'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      
      const settingsData = {
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      }

      const { error } = await supabase
        .from('system_settings')
        .upsert(settingsData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'Configurações do sistema salvas com sucesso'
      })

      // Update document head
      updateDocumentHead()
      
      // Refresh global system settings context
      await refreshSettings()

    } catch (error) {
      console.error('Error saving settings:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Erro ao salvar configurações do sistema'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateDocumentHead = () => {
    // Update title
    document.title = settings.meta_title

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', settings.meta_description)
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaKeywords) {
      metaKeywords.setAttribute('content', settings.site_keywords)
    }

    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]')
    if (favicon && settings.favicon_url) {
      favicon.setAttribute('href', settings.favicon_url)
    }

    // Update theme color
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) {
      themeColor.setAttribute('content', settings.primary_color)
    }
  }

  const handleInputChange = (field: keyof SystemSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = async (field: 'favicon_url' | 'logo_url', file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${field}_${Date.now()}.${fileExt}`
      const filePath = `system/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath)

      handleInputChange(field, data.publicUrl)

      addToast({
        type: 'success',
        title: 'Upload realizado!',
        description: 'Arquivo enviado com sucesso'
      })

    } catch (error) {
      console.error('Error uploading file:', error)
      addToast({
        type: 'error',
        title: 'Erro no upload',
        description: 'Erro ao enviar arquivo'
      })
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Acesso Restrito</h2>
          <p className="text-gray-400">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Configurações do Sistema
          </h1>
          <p className="text-gray-400 mt-2">
            Gerencie as configurações globais da aplicação, SEO e identidade visual
          </p>
        </div>

        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Identidade do Site */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Identidade do Site</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="site_name">Nome do Site</Label>
              <Input
                id="site_name"
                value={settings.site_name}
                onChange={(e) => handleInputChange('site_name', e.target.value)}
                placeholder="Nome da aplicação"
              />
            </div>

            <div>
              <Label htmlFor="site_description">Descrição</Label>
              <Textarea
                id="site_description"
                value={settings.site_description}
                onChange={(e) => handleInputChange('site_description', e.target.value)}
                placeholder="Descrição do site"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="site_url">URL do Site</Label>
              <Input
                id="site_url"
                value={settings.site_url}
                onChange={(e) => handleInputChange('site_url', e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>
          </div>
        </motion.div>

        {/* SEO e Meta Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Search className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">SEO e Meta Tags</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Título Meta</Label>
              <Input
                id="meta_title"
                value={settings.meta_title}
                onChange={(e) => handleInputChange('meta_title', e.target.value)}
                placeholder="Título que aparece na aba do navegador"
              />
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Descrição</Label>
              <Textarea
                id="meta_description"
                value={settings.meta_description}
                onChange={(e) => handleInputChange('meta_description', e.target.value)}
                placeholder="Descrição que aparece nos resultados de busca"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="site_keywords">Palavras-chave</Label>
              <Input
                id="site_keywords"
                value={settings.site_keywords}
                onChange={(e) => handleInputChange('site_keywords', e.target.value)}
                placeholder="palavras, separadas, por, vírgula"
              />
            </div>
          </div>
        </motion.div>

        {/* Identidade Visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <FileImage className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Identidade Visual</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="logo_url">Logo Principal</Label>
              <div className="flex gap-2">
                <Input
                  id="logo_url"
                  value={settings.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  placeholder="URL do logo"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handleFileUpload('logo_url', file)
                    }
                    input.click()
                  }}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {settings.logo_url && (
                <div className="mt-2 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <img 
                    src={settings.logo_url} 
                    alt="Logo Preview" 
                    className="h-12 w-auto object-contain"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="favicon_url">Favicon</Label>
              <div className="flex gap-2">
                <Input
                  id="favicon_url"
                  value={settings.favicon_url}
                  onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                  placeholder="URL do favicon"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handleFileUpload('favicon_url', file)
                    }
                    input.click()
                  }}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {settings.favicon_url && (
                <div className="mt-2 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <img 
                    src={settings.favicon_url} 
                    alt="Favicon Preview" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Cores do Tema */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Palette className="h-5 w-5 text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Cores do Tema</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="primary_color">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
              <div 
                className="mt-2 h-8 rounded-lg border border-gray-700"
                style={{ backgroundColor: settings.primary_color }}
              />
            </div>

            <div>
              <Label htmlFor="secondary_color">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  placeholder="#1f2937"
                  className="flex-1"
                />
              </div>
              <div 
                className="mt-2 h-8 rounded-lg border border-gray-700"
                style={{ backgroundColor: settings.secondary_color }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Preview das Configurações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <Eye className="h-5 w-5 text-cyan-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Preview das Configurações</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h3 className="font-semibold text-white mb-2">Como aparecerá no Google:</h3>
            <div className="space-y-1">
              <div className="text-blue-400 text-lg hover:underline cursor-pointer">
                {settings.meta_title}
              </div>
              <div className="text-green-600 text-sm">
                {settings.site_url}
              </div>
              <div className="text-gray-300 text-sm">
                {settings.meta_description}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h3 className="font-semibold text-white mb-2">Aba do Navegador:</h3>
            <div className="flex items-center gap-2 p-2 bg-gray-900 rounded">
              {settings.favicon_url && (
                <img src={settings.favicon_url} alt="Favicon" className="h-4 w-4" />
              )}
              <span className="text-white text-sm">{settings.meta_title}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}