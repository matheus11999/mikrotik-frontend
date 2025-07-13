import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { updatePWAManifest } from '../lib/pwa-manifest'

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

interface SystemSettingsContextType {
  settings: SystemSettings
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
}

const defaultSettings: SystemSettings = {
  site_name: 'MikroPix',
  site_description: 'Sistema completo de gestão para MikroTik, hotspots e infraestrutura de rede.',
  site_keywords: 'mikrotik, hotspot, provedor, internet, wifi, routeros, gestão, rede',
  site_url: 'https://mikropix.online',
  favicon_url: '/img/logo.svg',
  logo_url: '/img/logo.svg',
  primary_color: '#3b82f6',
  secondary_color: '#1f2937',
  meta_title: 'MikroPix - Sistema de Gestão MikroTik',
  meta_description: 'Sistema completo de gestão para MikroTik, hotspots e infraestrutura de rede. Interface moderna com templates personalizáveis e monitoramento em tempo real.'
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined)

interface SystemSettingsProviderProps {
  children: ReactNode
}

export function SystemSettingsProvider({ children }: SystemSettingsProviderProps) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        console.log('⚙️ [SYSTEM-SETTINGS] Configurações carregadas do Supabase:', data)
        setSettings(data)
        updateDocumentHead(data)
        updatePWAManifest()
      } else {
        // No settings found, use defaults
        console.log('⚙️ [SYSTEM-SETTINGS] Nenhuma configuração encontrada, usando padrões:', defaultSettings)
        setSettings(defaultSettings)
        updateDocumentHead(defaultSettings)
        updatePWAManifest()
      }
    } catch (error) {
      console.error('Error loading system settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to load settings')
      // Use defaults on error
      setSettings(defaultSettings)
      updateDocumentHead(defaultSettings)
      updatePWAManifest()
    } finally {
      setLoading(false)
    }
  }

  const updateDocumentHead = (settings: SystemSettings) => {
    // Update title
    document.title = settings.meta_title

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', settings.meta_description)
    }

    // Update favicon with proper Supabase URL handling
    const favicon = document.querySelector('#favicon') as HTMLLinkElement
    if (favicon && settings.favicon_url && settings.favicon_url !== '/img/logo.svg') {
      console.log('🔗 [FAVICON] Updating favicon to Supabase URL:', settings.favicon_url)
      favicon.href = settings.favicon_url
    }

    // Update apple-touch-icon with proper Supabase URL handling
    const appleTouchIcon = document.querySelector('#apple-touch-icon') as HTMLLinkElement
    if (appleTouchIcon && settings.favicon_url && settings.favicon_url !== '/img/logo.svg') {
      console.log('🍎 [APPLE-TOUCH-ICON] Updating apple-touch-icon to Supabase URL:', settings.favicon_url)
      appleTouchIcon.href = settings.favicon_url
    }

    // Update theme color
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) {
      themeColor.setAttribute('content', settings.primary_color)
    }

    // Update MSApplication tile color
    const msApplicationTileColor = document.querySelector('meta[name="msapplication-TileColor"]')
    if (msApplicationTileColor) {
      msApplicationTileColor.setAttribute('content', settings.primary_color)
    }

    // Update Open Graph image with logo URL if available, otherwise favicon
    const ogImage = document.querySelector('meta[property="og:image"]')
    const imageUrl = (settings.logo_url && settings.logo_url !== '/img/logo.svg') ? settings.logo_url : settings.favicon_url
    if (ogImage && imageUrl && imageUrl !== '/img/logo.svg') {
      console.log('📖 [OG-IMAGE] Updating Open Graph image to:', imageUrl)
      ogImage.setAttribute('content', imageUrl)
    }

    // Update Twitter image with logo URL if available, otherwise favicon
    const twitterImage = document.querySelector('meta[name="twitter:image"]')
    if (twitterImage && imageUrl && imageUrl !== '/img/logo.svg') {
      console.log('🐦 [TWITTER-IMAGE] Updating Twitter image to:', imageUrl)
      twitterImage.setAttribute('content', imageUrl)
    }

    // Update Open Graph title and description
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', settings.meta_title)
    }

    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) {
      ogDescription.setAttribute('content', settings.meta_description)
    }
  }

  const refreshSettings = async () => {
    await loadSettings()
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const value: SystemSettingsContextType = {
    settings,
    loading,
    error,
    refreshSettings
  }

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  )
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext)
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider')
  }
  return context
}