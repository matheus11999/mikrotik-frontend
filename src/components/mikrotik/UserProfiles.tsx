/**
 * 📋 User Profiles - Layout 2 Colunas Otimizado
 * 
 * Gerenciamento de perfis/planos do hotspot com destaque para sincronização e valores
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Settings, 
  Clock, 
  Gauge, 
  Users,
  Edit2,
  Trash2,
  Database,
  RefreshCw,
  DollarSign,
  Wifi,
  Activity,
  Shield,
  ChevronRight,
  ChevronLeft,
  Link,
  Unlink,
  Crown,
  TrendingUp
} from 'lucide-react'

// Components
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { useToast } from '../ui/toast'
import ProfileModal from './modals/ProfileModal'

// Services
import { systemSettingsService } from '../../services/systemSettingsService'
import { supabase } from '../../lib/supabase'

// Types
interface HotspotProfile {
  '.id': string
  name: string
  'rate-limit'?: string
  'session-timeout'?: string
  'idle-timeout'?: string
  'shared-users'?: string
  disabled?: boolean | string
  valor?: number
  userCount?: number
}

interface UserProfilesProps {
  mikrotikId: string
  mikrotikName?: string
  session: any
  baseUrl?: string
  headers?: Record<string, string>
  onRefresh?: () => void
}

interface SupabaseProfile {
  id: string
  mikrotik_id: string
  nome: string
  descricao?: string
  valor: number
  minutos?: number
  session_timeout?: string
  idle_timeout?: string
  velocidade_download?: string
  velocidade_upload?: string
  rate_limit?: string
  limite_dados?: string
  ativo: boolean
  visivel: boolean
  ordem: number
  mikrotik_profile_id?: string
  shared_users?: number
  add_mac_cookie?: boolean
  mac_cookie_timeout?: string
  keepalive_timeout?: string
  status_autorefresh?: string
  created_at?: string
  updated_at?: string
}

interface HotspotUser {
  '.id': string
  name: string
  password?: string
  profile?: string
  comment?: string
  disabled?: string | boolean
  'bytes-in'?: string
  'bytes-out'?: string
  uptime?: string
}

// Get API URL from system settings
const getApiUrl = async () => {
  try {
    const url = await systemSettingsService.getMikrotikApiUrl()
    console.log('[UserProfiles] Got API URL from settings:', url)
    return url
  } catch (error) {
    console.error('[UserProfiles] Error getting API URL:', error)
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const fallbackUrl = isDev ? 'http://localhost:3001' : 'https://api.mikropix.online'
    console.log('[UserProfiles] Using fallback URL:', fallbackUrl)
    return fallbackUrl
  }
}

const UserProfiles: React.FC<UserProfilesProps> = ({ 
  mikrotikId, 
  mikrotikName, 
  session, 
  baseUrl: propBaseUrl, 
  headers: propHeaders, 
  onRefresh 
}) => {
  const { addToast } = useToast()
  
  // States
  const [profiles, setProfiles] = useState<HotspotProfile[]>([])
  const [supabasePlans, setSupabasePlans] = useState<SupabaseProfile[]>([])
  const [hotspotUsers, setHotspotUsers] = useState<HotspotUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<HotspotProfile | null>(null)
  const [baseUrl, setBaseUrl] = useState(propBaseUrl || '')
  const [syncingProfile, setSyncingProfile] = useState<string | null>(null)

  const itemsPerPage = 12 // 2 colunas x 6 linhas

  // Headers for API calls - use props if available, otherwise create from session
  const headers = useMemo(() => {
    if (propHeaders) {
      console.log('[UserProfiles] Using propHeaders:', propHeaders)
      return propHeaders
    }
    const token = session?.access_token || (session as any)?.session?.access_token
    console.log('[UserProfiles] Session token available:', !!token)
    console.log('[UserProfiles] Session object:', session)
    
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
    console.log('[UserProfiles] Using session headers:', authHeaders)
    return authHeaders
  }, [propHeaders, session?.access_token, session?.session?.access_token])

  // Fetch profiles from MikroTik
  const fetchProfiles = useCallback(async () => {
    if (!mikrotikId || !baseUrl) {
      console.log('[UserProfiles] Skipping fetch - missing mikrotikId or baseUrl:', { mikrotikId, baseUrl })
      return
    }

    try {
      console.log('[UserProfiles] Fetching profiles for MikroTik:', mikrotikId, 'using baseUrl:', baseUrl)
      console.log('[UserProfiles] Headers:', headers)
      
      const url = `${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user/profile`
      console.log('[UserProfiles] Full URL:', url)
      
      const response = await fetch(url, {
        headers
      })
      
      console.log('[UserProfiles] Response status:', response.status)
      console.log('[UserProfiles] Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('[UserProfiles] Error response body:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('[UserProfiles] Raw profiles response:', data)
      
      // Handle different response formats
      let profilesData = []
      if (Array.isArray(data)) {
        profilesData = data
      } else if (data.success && data.data) {
        profilesData = data.data
      } else if (data.data) {
        profilesData = data.data
      }
      
      setProfiles(profilesData)
      
      console.log('[UserProfiles] Profiles loaded:', profilesData?.length || 0)
    } catch (error) {
      console.error('[UserProfiles] Error fetching profiles:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao carregar planos: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }, [mikrotikId, baseUrl, headers, addToast])

  // Fetch Supabase plans
  const fetchSupabasePlans = useCallback(async () => {
    if (!mikrotikId) return

    try {
      console.log('[UserProfiles] Fetching Supabase plans for MikroTik:', mikrotikId)
      
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .eq('mikrotik_id', mikrotikId)
        .eq('ativo', true)
      
      if (error) {
        throw new Error(error.message)
      }
      
      console.log('[UserProfiles] Supabase plans response:', data)
      
      const validPlans = (data || []).filter(plan => 
        plan && plan.id && plan.nome && typeof plan.valor === 'number'
      )
      
      console.log('[UserProfiles] Valid plans after filtering:', validPlans)
      setSupabasePlans(validPlans)
    } catch (error) {
      console.error('[UserProfiles] Error fetching Supabase plans:', error)
    }
  }, [mikrotikId])

  // Fetch hotspot users
  const fetchHotspotUsers = useCallback(async () => {
    if (!mikrotikId || !baseUrl) {
      console.log('[UserProfiles] Skipping fetch - missing mikrotikId or baseUrl:', { mikrotikId, baseUrl })
      return
    }

    try {
      console.log('[UserProfiles] Fetching hotspot users for MikroTik:', mikrotikId, 'using baseUrl:', baseUrl)
      
      const url = `${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user`
      console.log('[UserProfiles] Users URL:', url)
      
      const response = await fetch(url, {
        headers
      })
      
      console.log('[UserProfiles] Users response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('[UserProfiles] Users error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('[UserProfiles] Raw users response:', data)
      
      // Handle different response formats
      let usersData = []
      if (Array.isArray(data)) {
        usersData = data
      } else if (data.success && data.data) {
        usersData = data.data
      } else if (data.data) {
        usersData = data.data
      }
      
      setHotspotUsers(usersData)
      
      console.log('[UserProfiles] Hotspot users loaded:', usersData?.length || 0)
    } catch (error) {
      console.error('[UserProfiles] Error fetching hotspot users:', error)
    }
  }, [mikrotikId, baseUrl, headers])

  // Load API URL on component mount - only if not provided as prop
  useEffect(() => {
    const loadApiUrl = async () => {
      if (!propBaseUrl) {
        const url = await getApiUrl()
        setBaseUrl(url)
      }
    }
    loadApiUrl()
  }, [propBaseUrl])

  // Load initial data immediately
  useEffect(() => {
    if (mikrotikId && session && baseUrl) {
      console.log('[UserProfiles] Loading initial data...', { 
        mikrotikId, 
        baseUrl, 
        hasSession: !!session,
        hasToken: !!(session?.access_token || session?.session?.access_token)
      })
      setLoading(true)
      
      // Load all data
      Promise.all([
        fetchSupabasePlans(),
        fetchProfiles(),
        fetchHotspotUsers()
      ]).finally(() => setLoading(false))
    } else {
      console.log('[UserProfiles] Missing required data:', { 
        mikrotikId: !!mikrotikId, 
        session: !!session, 
        baseUrl: !!baseUrl 
      })
    }
  }, [mikrotikId, session, baseUrl, fetchProfiles, fetchHotspotUsers, fetchSupabasePlans])

  // This effect is now redundant - removed
  
  // Update baseUrl when propBaseUrl changes
  useEffect(() => {
    if (propBaseUrl && propBaseUrl !== baseUrl) {
      setBaseUrl(propBaseUrl)
    }
  }, [propBaseUrl, baseUrl])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchProfiles(), fetchSupabasePlans(), fetchHotspotUsers()])
      addToast({
        type: 'success',
        title: 'Atualizado!',
        description: 'Dados atualizados com sucesso'
      })
    } finally {
      setRefreshing(false)
    }
  }, [fetchProfiles, fetchSupabasePlans, fetchHotspotUsers, addToast])

  // Sync profile to Supabase
  const handleSyncProfile = async (profile: HotspotProfile) => {
    const valor = prompt(`Digite o valor do plano "${profile.name}" (em R$):`, '10.00')
    
    if (!valor || parseFloat(valor) <= 0) {
      addToast({
        type: 'warning',
        title: 'Valor inválido',
        description: 'Digite um valor válido maior que zero'
      })
      return
    }

    setSyncingProfile(profile['.id'])
    
    try {
      console.log('[UserProfiles] Syncing profile:', profile.name, 'with value:', valor)
      
      const valorNumerico = parseFloat(valor)
      
      // Check if plan already exists in database
      const existingPlan = supabasePlans.find(plan => plan.nome === profile.name)
      
      // Parse rate limit safely
      const rateLimit = profile['rate-limit'] || ''
      const rateLimitParts = rateLimit.includes('/') ? rateLimit.split('/') : ['', '']
      
      // Parse session timeout safely
      const sessionTimeout = profile['session-timeout'] || ''
      const sessionTimeoutNumber = sessionTimeout ? parseInt(sessionTimeout) : null
      
      const profilePayload = {
        mikrotik_id: mikrotikId,
        nome: profile.name || '',
        valor: valorNumerico,
        descricao: `Plano ${profile.name || 'Sem nome'}`,
        rate_limit: rateLimit || null,
        session_timeout: sessionTimeout || null,
        idle_timeout: profile['idle-timeout'] || null,
        velocidade_upload: rateLimitParts[0] || null,
        velocidade_download: rateLimitParts[1] || null,
        minutos: sessionTimeoutNumber ? Math.floor(sessionTimeoutNumber / 60) : null,
        ativo: !profile.disabled,
        visivel: true,
        ordem: 0,
        mikrotik_profile_id: profile['.id'] || profile.name
      }
      
      console.log('[UserProfiles] Profile payload:', profilePayload)
      
      if (existingPlan) {
        console.log('[UserProfiles] Updating existing plan:', existingPlan.id)
        const { error } = await supabase
          .from('planos')
          .update({
            ...profilePayload,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPlan.id)
        
        if (error) {
          throw new Error(`Erro ao atualizar plano: ${error.message}`)
        }
      } else {
        console.log('[UserProfiles] Creating new plan')
        const { error } = await supabase
          .from('planos')
          .insert([{
            ...profilePayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        
        if (error) {
          throw new Error(`Erro ao criar plano: ${error.message}`)
        }
      }
      
      await fetchSupabasePlans()
      
      addToast({
        type: 'success',
        title: 'Sincronizado!',
        description: `Plano "${profile.name}" sincronizado com valor R$ ${valorNumerico.toFixed(2)}`
      })
      
    } catch (error) {
      console.error('[UserProfiles] Error syncing profile:', error)
      addToast({
        type: 'error',
        title: 'Erro na sincronização!',
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setSyncingProfile(null)
    }
  }

  // Remove sync from Supabase
  const handleUnsyncProfile = async (profile: HotspotProfile) => {
    const syncedData = supabasePlans.find(plan => plan.nome === profile.name)
    if (!syncedData) {
      addToast({
        type: 'warning',
        title: 'Não sincronizado',
        description: 'Este plano não está sincronizado'
      })
      return
    }

    if (!confirm(`Tem certeza que deseja remover a sincronização do plano "${profile.name}"?`)) {
      return
    }

    setSyncingProfile(profile['.id'])
    
    try {
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', syncedData.id)
      
      if (error) {
        throw new Error(`Erro ao remover sincronização: ${error.message}`)
      }
      
      await fetchSupabasePlans()
      
      addToast({
        type: 'success',
        title: 'Sincronização removida!',
        description: `Plano "${profile.name}" removido do banco de dados`
      })
      
    } catch (error) {
      console.error('[UserProfiles] Error removing sync:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setSyncingProfile(null)
    }
  }

  // Get users count by profile
  const getUserCountByProfile = (profileName: string) => {
    return hotspotUsers.filter(user => user.profile === profileName).length
  }

  // Get profile sync data
  const getProfileSyncData = (profileName: string) => {
    return supabasePlans.find(plan => plan.nome === profileName)
  }

  // Filter and sort profiles
  const filteredProfiles = profiles
    .filter(profile =>
      profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile['rate-limit']?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Prioritize synced profiles first
      const aIsSynced = supabasePlans.some(plan => plan.nome === a.name)
      const bIsSynced = supabasePlans.some(plan => plan.nome === b.name)
      
      if (aIsSynced && !bIsSynced) return -1
      if (!aIsSynced && bIsSynced) return 1
      
      // Then sort by name
      return a.name?.localeCompare(b.name || '') || 0
    })

  // Paginated profiles
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage)
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-700/30 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-700/30 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-black/40 border border-gray-800/50 rounded-xl p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-700/30 rounded w-32"></div>
                <div className="h-8 bg-gray-700/30 rounded w-20"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-700/30 rounded"></div>
                <div className="h-4 bg-gray-700/30 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700/30 rounded w-1/2"></div>
              </div>
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Planos Hotspot</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-400">
            <span>
              {filteredProfiles.length} {filteredProfiles.length === 1 ? 'plano encontrado' : 'planos encontrados'}
            </span>
            <span>•</span>
            <span>
              {supabasePlans.length} sincronizado{supabasePlans.length !== 1 ? 's' : ''}
            </span>
            {searchTerm && (
              <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                Filtrado por: "{searchTerm}"
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''} sm:mr-2`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          
          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            size="sm"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo</span>
            <span className="hidden md:inline"> Plano</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar planos por nome ou velocidade..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="pl-10 bg-black/40 border-gray-800/50 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Profiles Grid */}
      {paginatedProfiles.length === 0 ? (
        <Card className="bg-black/40 border-gray-800/50 p-6 sm:p-8 text-center">
          <Settings className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {searchTerm ? 'Nenhum plano encontrado' : 'Nenhum plano configurado'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : 'Configure planos para organizar o acesso dos usuários'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paginatedProfiles.map((profile, index) => {
            const userCount = getUserCountByProfile(profile.name)
            const syncData = getProfileSyncData(profile.name)
            const isSynced = !!syncData
            const isProcessing = syncingProfile === profile['.id']
            
            return (
              <motion.div
                key={profile['.id']}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-black/40 border transition-all duration-300 ${
                  isSynced 
                    ? 'border-green-500/50 bg-gradient-to-br from-green-900/10 to-black/40' 
                    : 'border-gray-800/50 hover:border-blue-500/50'
                }`}>
                  <div className="p-6">
                    {/* Profile Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-3 rounded-lg ${
                          isSynced ? 'bg-green-600/20' : 'bg-blue-600/20'
                        }`}>
                          {isSynced ? (
                            <Crown className="h-6 w-6 text-green-400" />
                          ) : (
                            <Settings className="h-6 w-6 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-xl mb-1">{profile.name}</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {isSynced && (
                              <Badge variant="success" className="text-xs font-medium">
                                <Database className="h-3 w-3 mr-1" />
                                Sincronizado
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {userCount} usuário{userCount !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Valor em destaque */}
                      {syncData?.valor && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400 flex items-center gap-1">
                            <DollarSign className="h-5 w-5" />
                            R$ {syncData.valor.toFixed(2)}
                          </div>
                          <div className="text-xs text-green-300/70">valor do plano</div>
                        </div>
                      )}
                    </div>

                    {/* Profile Details */}
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      {profile['rate-limit'] && (
                        <div className="flex items-center gap-2 text-sm bg-gray-800/30 rounded-lg p-3">
                          <Gauge className="h-4 w-4 text-blue-400" />
                          <span className="text-gray-400">Velocidade:</span>
                          <span className="text-white font-medium">{profile['rate-limit']}</span>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        {profile['session-timeout'] && (
                          <div className="flex items-center gap-2 text-sm bg-gray-800/30 rounded-lg p-2">
                            <Clock className="h-4 w-4 text-yellow-400" />
                            <div>
                              <div className="text-xs text-gray-400">Sessão</div>
                              <div className="text-white font-medium">{profile['session-timeout']}</div>
                            </div>
                          </div>
                        )}
                        
                        {profile['idle-timeout'] && (
                          <div className="flex items-center gap-2 text-sm bg-gray-800/30 rounded-lg p-2">
                            <Activity className="h-4 w-4 text-orange-400" />
                            <div>
                              <div className="text-xs text-gray-400">Idle</div>
                              <div className="text-white font-medium">{profile['idle-timeout']}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                      {/* Sync/Unsync Button */}
                      {isSynced ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnsyncProfile(profile)}
                          disabled={isProcessing}
                          className="flex-1 border-red-600/30 text-red-400 hover:bg-red-600/10"
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin mr-2" />
                          ) : (
                            <Unlink className="h-3 w-3 mr-2" />
                          )}
                          Dessincronizar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncProfile(profile)}
                          disabled={isProcessing}
                          className="flex-1 border-green-600/30 text-green-400 hover:bg-green-600/10"
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-green-400/20 border-t-green-400 rounded-full animate-spin mr-2" />
                          ) : (
                            <Link className="h-3 w-3 mr-2" />
                          )}
                          Sincronizar
                        </Button>
                      )}

                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingProfile(profile)
                          setShowModal(true)
                        }}
                        className="border-blue-600/30 text-blue-400 hover:bg-blue-600/10"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      
                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600/30 text-red-400 hover:bg-red-600/10"
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o plano "${profile.name}"?`)) {
                            // handleDeleteProfile(profile)
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 order-2 sm:order-1">
            Página {currentPage} de {totalPages} • {filteredProfiles.length} plano{filteredProfiles.length !== 1 ? 's' : ''}
          </p>
          
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Anterior</span>
            </Button>
            
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span>{currentPage}</span>
              <span>/</span>
              <span>{totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline mr-1">Próxima</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showModal && (
        <ProfileModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setEditingProfile(null)
          }}
          onSubmit={(data) => {
            console.log('Profile submit:', data)
            // Handle profile submit
            setShowModal(false)
            setEditingProfile(null)
          }}
          profile={editingProfile as any}
          supabaseProfiles={supabasePlans}
        />
      )}
    </div>
  )
}

export default UserProfiles