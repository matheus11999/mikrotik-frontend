/**
 * 🔧 System Settings Service
 * 
 * Service para buscar configurações do sistema no Supabase
 * Inclui URL da API MikroTik e outras configurações globais
 */

import { supabase } from '../lib/supabase'

export interface SystemSettings {
  id: string
  site_name: string
  site_description?: string
  site_keywords?: string
  site_url?: string
  favicon_url?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  meta_title?: string
  meta_description?: string
  wireguard_server_public_key?: string
  wireguard_server_ip?: string
  wireguard_server_port?: string
  mikrotik_api_url?: string
  created_at?: string
  updated_at?: string
  updated_by?: string
}

class SystemSettingsService {
  private cache: SystemSettings | null = null
  private cacheTime: number = 0
  private cacheDuration = 5 * 60 * 1000 // 5 minutos

  /**
   * Busca as configurações do sistema
   */
  async getSystemSettings(): Promise<SystemSettings | null> {
    try {
      // Verifica cache
      if (this.cache && Date.now() - this.cacheTime < this.cacheDuration) {
        return this.cache
      }

      console.log('[SystemSettingsService] Fetching system settings from Supabase')
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single()
      
      if (error) {
        console.error('[SystemSettingsService] Error fetching system settings:', error)
        return null
      }
      
      // Atualiza cache
      this.cache = data
      this.cacheTime = Date.now()
      
      console.log('[SystemSettingsService] System settings loaded:', data)
      return data
      
    } catch (error) {
      console.error('[SystemSettingsService] Error:', error)
      return null
    }
  }

  /**
   * Busca apenas a URL da API MikroTik
   */
  async getMikrotikApiUrl(): Promise<string> {
    try {
      const settings = await this.getSystemSettings()
      
      if (settings?.mikrotik_api_url) {
        console.log('[SystemSettingsService] Using MikroTik API URL from settings:', settings.mikrotik_api_url)
        return settings.mikrotik_api_url
      }
      
      // Fallback para desenvolvimento
      const fallbackUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : 'http://router.mikropix.online:3001'
      
      console.log('[SystemSettingsService] Using fallback MikroTik API URL:', fallbackUrl)
      return fallbackUrl
      
    } catch (error) {
      console.error('[SystemSettingsService] Error getting MikroTik API URL:', error)
      
      // Fallback em caso de erro
      const fallbackUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : 'http://router.mikropix.online:3001'
      
      return fallbackUrl
    }
  }

  /**
   * Invalida o cache
   */
  clearCache(): void {
    this.cache = null
    this.cacheTime = 0
  }

  /**
   * Atualiza uma configuração específica
   */
  async updateSetting(key: keyof SystemSettings, value: any): Promise<boolean> {
    try {
      console.log(`[SystemSettingsService] Updating setting ${key}:`, value)
      
      const { error } = await supabase
        .from('system_settings')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('id', this.cache?.id || '634fece2-e3f1-4fec-924f-52c44d0dc46a')
      
      if (error) {
        console.error('[SystemSettingsService] Error updating setting:', error)
        return false
      }
      
      // Invalida cache para forçar reload
      this.clearCache()
      
      console.log(`[SystemSettingsService] Setting ${key} updated successfully`)
      return true
      
    } catch (error) {
      console.error('[SystemSettingsService] Error updating setting:', error)
      return false
    }
  }
}

export const systemSettingsService = new SystemSettingsService()