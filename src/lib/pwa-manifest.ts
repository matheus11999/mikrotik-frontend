import { supabase } from './supabase'

export interface PWAManifest {
  name: string
  short_name: string
  description: string
  theme_color: string
  background_color: string
  display: string
  scope: string
  start_url: string
  lang: string
  icons: Array<{
    src: string
    sizes: string
    type: string
  }>
}

export async function updatePWAManifest(): Promise<void> {
  try {
    // Get system settings
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading system settings for PWA manifest:', error)
      return
    }

    // Create dynamic manifest
    const manifest: PWAManifest = {
      name: settings?.site_name || 'MikroPix',
      short_name: settings?.site_name || 'MikroPix',
      description: settings?.site_description || 'Sistema de gestão MikroTik',
      theme_color: settings?.primary_color || '#3b82f6',
      background_color: '#000000',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      lang: 'pt-BR',
      icons: [
        {
          src: (settings?.logo_url && settings.logo_url !== '/img/logo.svg') ? settings.logo_url : '/img/logo.svg',
          sizes: '192x192',
          type: settings?.logo_url?.includes('supabase') ? 'image/png' : 'image/svg+xml'
        },
        {
          src: (settings?.logo_url && settings.logo_url !== '/img/logo.svg') ? settings.logo_url : '/img/logo.svg',
          sizes: '512x512',
          type: settings?.logo_url?.includes('supabase') ? 'image/png' : 'image/svg+xml'
        },
        {
          src: (settings?.logo_url && settings.logo_url !== '/img/logo.svg') ? settings.logo_url : '/img/logo.svg',
          sizes: 'any',
          type: settings?.logo_url?.includes('supabase') ? 'image/png' : 'image/svg+xml'
        }
      ]
    }

    // Update existing manifest link or create new one
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    
    if (!manifestLink) {
      manifestLink = document.createElement('link')
      manifestLink.rel = 'manifest'
      document.head.appendChild(manifestLink)
    }

    // Create blob URL with updated manifest
    const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json'
    })
    
    const manifestUrl = URL.createObjectURL(manifestBlob)
    manifestLink.href = manifestUrl

    console.log('PWA manifest updated with system settings:', manifest)
  } catch (error) {
    console.error('Error updating PWA manifest:', error)
  }
}

export function generateStaticManifest(): PWAManifest {
  return {
    name: 'MikroPix',
    short_name: 'MikroPix',
    description: 'Sistema de gestão MikroTik',
    theme_color: '#3b82f6',
    background_color: '#000000',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    lang: 'pt-BR',
    icons: [
      {
        src: '/img/logo.svg',
        sizes: '192x192',
        type: 'image/svg+xml'
      },
      {
        src: '/img/logo.svg',
        sizes: '512x512',
        type: 'image/svg+xml'
      },
      {
        src: '/img/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  }
}