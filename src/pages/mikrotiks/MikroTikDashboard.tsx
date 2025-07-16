/**
 * 🎯 MikroTik Dashboard - Versão Otimizada
 * 
 * Dashboard principal para gerenciamento completo de MikroTik
 * Organizado em abas com componentes separados
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Users,
  Database,
  Server,
  Settings,
  Layout,
  AlertCircle
} from 'lucide-react'

// Components
import { Button } from '../../components/ui/button'
import { useToast } from '../../components/ui/toast'
import { useAuthContext } from '../../contexts/AuthContext'

// Tab Components
import OverviewTab from '../../components/mikrotik/tabs/OverviewTab'
import HotspotUsersNew from '../../components/mikrotik/HotspotUsersNew'
import UserProfiles from '../../components/mikrotik/UserProfiles'
import ServerProfilesTab from '../../components/mikrotik/tabs/ServerProfilesTab'
import ServersTab from '../../components/mikrotik/tabs/ServersTab'
import TemplatesTab from '../../components/mikrotik/tabs/TemplatesTab'

// Services
import { systemSettingsService } from '../../services/systemSettingsService'
import { supabase } from '../../lib/supabase'

// Types
interface MikroTikInfo {
  id: string
  nome: string
  ip: string
  username: string
  ativo: boolean
}

type TabType = 'overview' | 'users' | 'profiles' | 'servers' | 'serverProfiles' | 'templates'

interface TabConfig {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<any>
}

// Get API URL from system settings
const getApiUrl = async () => {
  try {
    const url = await systemSettingsService.getMikrotikApiUrl()
    console.log('[MikroTikDashboard] Got API URL from settings:', url)
    return url
  } catch (error) {
    console.error('[MikroTikDashboard] Error getting API URL:', error)
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const fallbackUrl = isDev ? 'http://localhost:3001' : 'https://api.mikropix.online'
    console.log('[MikroTikDashboard] Using fallback URL:', fallbackUrl)
    return fallbackUrl
  }
}

const MikroTikDashboard: React.FC = () => {
  const { mikrotikId } = useParams<{ mikrotikId: string }>()
  const navigate = useNavigate()
  const { session } = useAuthContext()
  const { addToast } = useToast()

  // States
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [mikrotikInfo, setMikrotikInfo] = useState<MikroTikInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Headers for API calls
  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || (session as any)?.session?.access_token}`
  }), [session?.access_token, (session as any)?.session?.access_token])

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: BarChart3,
      component: OverviewTab
    },
    {
      id: 'users',
      label: 'Usuários Hotspot',
      icon: Users,
      component: HotspotUsersNew
    },
    {
      id: 'profiles',
      label: 'Planos (User Profiles)',
      icon: Database,
      component: UserProfiles
    },
    {
      id: 'serverProfiles',
      label: 'Server Profiles',
      icon: Settings,
      component: ServerProfilesTab
    },
    {
      id: 'servers',
      label: 'Servidores',
      icon: Server,
      component: ServersTab
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: Layout,
      component: TemplatesTab
    }
  ]

  // Load API URL on component mount
  useEffect(() => {
    const loadApiUrl = async () => {
      const url = await getApiUrl()
      setBaseUrl(url)
    }
    loadApiUrl()
  }, [])

  // Fetch MikroTik info
  const fetchMikroTikInfo = useCallback(async () => {
    if (!mikrotikId || !session?.user?.id) {
      console.log('[MikroTikDashboard] Missing mikrotikId or user id:', { mikrotikId, userId: session?.user?.id })
      return
    }

    try {
      console.log('[MikroTikDashboard] Fetching MikroTik info for:', { mikrotikId, userId: session.user.id })
      
      const { data, error } = await supabase
        .from('mikrotiks')
        .select('id, nome, ip, username, ativo')
        .eq('id', mikrotikId)
        .eq('user_id', session.user.id)
        .single()

      console.log('[MikroTikDashboard] Supabase response:', { data, error })

      if (error) {
        console.error('[MikroTikDashboard] Supabase error:', error)
        throw error
      }

      if (!data) {
        throw new Error('MikroTik não encontrado ou você não tem permissão para acessá-lo')
      }

      console.log('[MikroTikDashboard] MikroTik info loaded successfully:', data)
      setMikrotikInfo(data)
      setError(null)
    } catch (error) {
      console.error('[MikroTikDashboard] Error fetching MikroTik info:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar informações do MikroTik')
    }
  }, [mikrotikId, session?.user?.id])

  // Load data when dependencies are available
  useEffect(() => {
    if (mikrotikId && session?.user?.id) {
      setLoading(true)
      fetchMikroTikInfo().finally(() => setLoading(false))
    }
  }, [mikrotikId, session?.user?.id, fetchMikroTikInfo])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchMikroTikInfo()
      addToast({
        type: 'success',
        title: 'Atualizado!',
        description: 'Informações atualizadas com sucesso'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Falha ao atualizar informações'
      })
    } finally {
      setRefreshing(false)
    }
  }, [fetchMikroTikInfo, addToast])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2"
          >
            Carregando Dashboard
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400"
          >
            Inicializando sistema MikroTik...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Erro no Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/app/mikrotiks')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Lista
            </Button>
            <Button 
              onClick={handleRefresh}
              className="w-full"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Tentar Novamente
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Render active tab component
  const renderActiveTab = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab)
    if (!activeTabConfig || !baseUrl) return null

    const Component = activeTabConfig.component
    const commonProps = {
      mikrotikId: mikrotikId!,
      mikrotikName: mikrotikInfo?.nome || 'MikroTik',
      session,
      baseUrl,
      headers,
      onRefresh: handleRefresh
    }

    return <Component {...commonProps} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back button and title */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/app/mikrotiks')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/90 hover:to-gray-600/90 text-white rounded-xl border border-gray-600/30 backdrop-blur-sm transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Voltar</span>
              </motion.button>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {mikrotikInfo?.nome}
                </h1>
                <p className="text-sm text-gray-400">
                  {mikrotikInfo?.ip} • {mikrotikInfo?.ativo ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>

            {/* Refresh button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-500/90 hover:to-blue-400/90 text-white rounded-xl border border-blue-500/30 backdrop-blur-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-medium">Atualizar</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {!baseUrl ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Carregando configurações...</p>
              </div>
            </div>
          ) : (
            renderActiveTab()
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default MikroTikDashboard