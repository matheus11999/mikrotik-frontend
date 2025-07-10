import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  Users, 
  UserCheck, 
  Settings, 
  Server, 
  Database,
  RefreshCw,
  AlertCircle,
  X,
  ArrowLeft
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthContext } from '../../contexts/AuthContext'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useToast } from '../../components/ui/toast'
import { FiUsers, FiList, FiLayout, FiServer } from 'react-icons/fi'
import { SimpleModal } from '../../components/SimpleModal'
import { BentoGrid, BentoGridItem } from '../../components/ui/bento-grid'
import { formatUsersForAPI, type GeneratedUser } from '../../utils/passwordGenerator'

// Import new components
import SystemInfoCards from '../../components/mikrotik/SystemInfoCards'
import HotspotUsersTab from '../../components/mikrotik/HotspotUsersTab'
import HotspotProfilesTab from '../../components/mikrotik/HotspotProfilesTab'
import HotspotServersTab from '../../components/mikrotik/HotspotServersTab'
import HotspotServerProfilesTab from '../../components/mikrotik/HotspotServerProfilesTab'
import ActiveUsersTab from '../../components/mikrotik/ActiveUsersTab'

// Import modals
import UserModal from '../../components/mikrotik/modals/UserModal'
import ProfileModal from '../../components/mikrotik/modals/ProfileModal'
import ServerModal from '../../components/mikrotik/modals/ServerModal'
import ServerProfileModal from '../../components/mikrotik/modals/ServerProfileModal'
import PrintPasswordsModal from '../../components/mikrotik/PrintPasswordsModal'
import GeneratePasswordsModal from '../../components/mikrotik/GeneratePasswordsModal'

// Types
interface MikrotikStats {
  version?: string
  uptime?: string
  'cpu-load'?: string
  'free-memory'?: string
  'total-memory'?: string
  'free-hdd-space'?: string
  'total-hdd-space'?: string
  'board-name'?: string
  // Nested objects
  resource?: {
    'architecture-name'?: string
    'board-name'?: string
    'cpu-count'?: string
    'cpu-frequency'?: string
    'cpu-load'?: string
    cpu?: string
    'free-memory'?: string
    'total-memory'?: string
    'free-hdd-space'?: string
    'total-hdd-space'?: string
    uptime?: string
    version?: string
    'write-sect-since-reboot'?: string
    'write-sect-total'?: string
    'bad-blocks'?: string
  }
  routerboard?: {
    model?: string
    'serial-number'?: string
    'firmware-type'?: string
    'current-firmware'?: string
    routerboard?: string
  }
  identity?: {
    name?: string
  }
}

interface HotspotUser {
  '.id': string
  name: string
  password?: string
  profile?: string
  comment?: string
  disabled?: boolean
}

interface ActiveUser {
  '.id': string
  user: string
  address: string
  'mac-address': string
  'login-time': string
  uptime: string
  'bytes-in': string
  'bytes-out': string
  profile?: string
}

interface HotspotProfile {
  '.id': string
  name: string
  'rate-limit'?: string
  'session-timeout'?: string
  'idle-timeout'?: string
  valor?: number
  disabled?: boolean
  inDatabase?: boolean
  supabaseId?: string
  comment?: string
}

interface HotspotServer {
  '.id': string
  name: string
  interface?: string
  'address-pool'?: string
  profile?: string
  disabled?: boolean
  comment?: string
}

interface HotspotServerProfile {
  '.id': string
  name: string
  'html-directory'?: string
  'login-page'?: string
  'split-user-domain'?: string
  disabled?: boolean
  comment?: string
}

interface Template {
  id: string
  name: string
  description: string
  preview?: string
  variables: TemplateVariable[]
}

interface TemplateVariable {
  key: string
  label: string
  type: 'text' | 'color' | 'url' | 'number' | 'select'
  required: boolean
  placeholder?: string
  description?: string // Descrição opcional para cada variável
  options?: { value: string; label: string }[] // Para tipo select
}

interface TemplateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (profileId: string) => void;
  profiles: HotspotProfile[];
}

// Add type for event
interface SelectChangeEvent extends React.ChangeEvent<HTMLSelectElement> {
  target: HTMLSelectElement;
}

// Helper function to format memory values
const formatMemory = (bytes?: string): string => {
  if (!bytes) return '0 MB'
  
  const numBytes = parseInt(bytes)
  if (isNaN(numBytes)) return bytes
  
  if (numBytes >= 1024 * 1024 * 1024) {
    return `${(numBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  } else if (numBytes >= 1024 * 1024) {
    return `${(numBytes / (1024 * 1024)).toFixed(0)} MB`
  } else if (numBytes >= 1024) {
    return `${(numBytes / 1024).toFixed(0)} KB`
  } else {
    return `${numBytes} B`
  }
}

// Helper function to format uptime
const formatUptime = (uptime?: string): string => {
  if (!uptime) return 'N/A'
  
  // If uptime is already formatted, return as is
  if (uptime.includes('d') || uptime.includes('h') || uptime.includes('m')) {
    return uptime
  }
  
  // If it's in seconds, convert to readable format
  const seconds = parseInt(uptime)
  if (isNaN(seconds)) return uptime
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

// Helper function to get CPU info with better fallbacks
const getCpuInfo = (stats: MikrotikStats | null) => {
  if (!stats?.resource) return { load: '0%', type: 'N/A', frequency: 'N/A' }
  
  // CPU load já vem como número do backend, adicionar %
  const load = stats.resource['cpu-load'] ? `${stats.resource['cpu-load']}%` : '0%'
  // Prioriza o tipo de CPU (ex: "MIPS 1004Kc V2.15") sobre número de cores
  const type = stats.resource.cpu || (stats.resource['cpu-count'] ? `${stats.resource['cpu-count']} Core${parseInt(stats.resource['cpu-count'] || '1') > 1 ? 's' : ''}` : 'N/A')
  const frequency = stats.resource['cpu-frequency'] ? `${stats.resource['cpu-frequency']} MHz` : 'N/A'
  
  return { load, type, frequency }
}

// Helper function to get system info with better fallbacks
const getSystemInfo = (stats: MikrotikStats | null) => {
  if (!stats) return { model: 'N/A', identity: 'N/A', version: 'N/A' }
  
  // Usar exatamente a mesma lógica da MikrotiksList: stats?.routerboard?.model || stats?.resource?.['board-name'] || 'N/A'
  const model = stats.routerboard?.model || stats.resource?.['board-name'] || 'RouterBoard'
  const identity = stats.identity?.name || 'RouterOS'
  const version = stats.routerboard?.['current-firmware'] || stats.resource?.version || stats.version || 'N/A'
  
  console.log('[getSystemInfo] Routerboard model:', stats.routerboard?.model)
  console.log('[getSystemInfo] Board name:', stats.resource?.['board-name'])
  console.log('[getSystemInfo] Selected model:', model)
  
  return { model, identity, version }
}

// Helper function to check if data is loading or missing
const getDataStatus = (stats: MikrotikStats | null, loading: boolean) => {
  if (loading) return 'Carregando...'
  if (!stats) return 'Sem dados'
  return null
}

// Add template components
const TemplateProfileModal: React.FC<TemplateProfileModalProps> = ({ isOpen, onClose, onConfirm, profiles }) => {
  const [selectedProfile, setSelectedProfile] = useState('')

  const handleConfirm = () => {
    onConfirm(selectedProfile)
    onClose()
  }

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title="Selecionar Perfil">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="profile" className="block text-sm font-medium">
            Perfil do Hotspot
          </label>
          <select
            id="profile"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
          >
            <option value="">Selecione um perfil</option>
            {profiles.map((profile) => (
              <option key={profile['.id']} value={profile['.id']}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedProfile}>
            Confirmar
          </Button>
        </div>
      </div>
    </SimpleModal>
  )
}

export default function MikrotikDashboard() {
  const { mikrotikId } = useParams<{ mikrotikId: string }>()
  const { user, session } = useAuthContext()
  const { addToast } = useToast()
  const navigate = useNavigate()
  
  // States
  const [stats, setStats] = useState<MikrotikStats | null>(null)
  const [mikrotikInfo, setMikrotikInfo] = useState<any>(null) // Store mikrotik connection info
  const [users, setUsers] = useState<HotspotUser[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [profiles, setProfiles] = useState<HotspotProfile[]>([])
  const [servers, setServers] = useState<HotspotServer[]>([])
  const [serverProfiles, setServerProfiles] = useState<HotspotServerProfile[]>([])
  const [supabasePlans, setSupabasePlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState<string | null>(null)
  const [cpuMemoryData, setCpuMemoryData] = useState<any>(null)
  
  // Templates state
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesCached, setTemplatesCached] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Reset dataLoaded flag when mikrotikId changes
  useEffect(() => {
    setDataLoaded(false)
    setTemplatesCached(false)
  }, [mikrotikId])

  // Modal states
  const [modals, setModals] = useState({
    user: false,
    profile: false,
    server: false,
    serverProfile: false,
    templateProfile: false,
    templateLoading: false,
    wireguard: false,
    generatePasswords: false
  })

  // Editing states
  const [editingItems, setEditingItems] = useState({
    user: null as HotspotUser | null,
    profile: null as HotspotProfile | null,
    server: null as HotspotServer | null,
    serverProfile: null as HotspotServerProfile | null
  })

  // Template states (now loaded from backend)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [selectedServerProfile, setSelectedServerProfile] = useState<string>('')
  
  // Print Passwords States
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [selectedPasswordTemplate, setSelectedPasswordTemplate] = useState('')
  const [customTemplate, setCustomTemplate] = useState('')
  const [planUsers, setPlanUsers] = useState<HotspotUser[]>([])

  // API functions
  const baseUrl = import.meta.env.VITE_API_URL || 'https://api.mikropix.online'
  const headers = {
    'Authorization': `Bearer ${session?.access_token || ''}`
  }

  // Helper function to get MikroTik connection parameters
  const getMikrotikParams = () => {
    if (mikrotikInfo) {
      return {
        ip: mikrotikInfo.ip || '10.8.0.3',
        username: mikrotikInfo.username || 'admin',
        password: mikrotikInfo.password || '260520',
        port: mikrotikInfo.port?.toString() || '8728'
      }
    }
    // Fallback to default values if mikrotikInfo is not available
    return {
      ip: '10.8.0.3',
      username: 'admin',
      password: '260520',
      port: '8728'
    }
  }

  // Separate fetch functions for each data type
  const fetchStats = useCallback(async () => {
    if (!mikrotikId || !session?.access_token) return

    try {
      // Usar o mesmo endpoint que a MikrotiksList para garantir dados consistentes
      const statsRes = await fetch(`${baseUrl}/api/mikrotik/essential-info/${mikrotikId}`, { headers })
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        console.log('Stats data received:', statsData)
        
        if (statsData.data?.mikrotik) {
          setMikrotikInfo(statsData.data.mikrotik)
        }
        
        // Agora usando essential-info (mesmo endpoint da MikrotiksList)
        // Estrutura: { success: true, data: { resource: {...}, identity: {...}, routerboard: {...} } }
        const resourceData = statsData.data?.resource || {}
        const identityData = statsData.data?.identity || {}
        const routerboardData = statsData.data?.routerboard || {}
        
        console.log('[Dashboard] Essential-info response:', JSON.stringify(statsData, null, 2))
        console.log('[Dashboard] Resource data:', JSON.stringify(resourceData, null, 2))
        console.log('[Dashboard] Identity data:', JSON.stringify(identityData, null, 2))
        console.log('[Dashboard] Routerboard data:', JSON.stringify(routerboardData, null, 2))
        console.log('[Dashboard] Board name:', resourceData['board-name'])
        console.log('[Dashboard] Routerboard model:', routerboardData.model)
        
        // Estruturar dados exatamente como a MikrotiksList
        const processedSystemData = {
          resource: {
            'board-name': resourceData['board-name'],
            'cpu-load': resourceData['cpu-load'],
            cpu: resourceData.cpu,
            'cpu-frequency': resourceData['cpu-frequency'],
            'free-memory': resourceData['free-memory'],
            'total-memory': resourceData['total-memory'],
            'free-hdd-space': resourceData['free-hdd-space'],
            'total-hdd-space': resourceData['total-hdd-space'],
            uptime: resourceData.uptime,
            version: resourceData.version
          },
          identity: {
            name: identityData.name
          },
          routerboard: {
            model: routerboardData.model,
            'serial-number': routerboardData['serial-number'],
            'firmware-type': routerboardData['firmware-type'],
            'current-firmware': routerboardData['current-firmware'],
            routerboard: routerboardData.routerboard
          }
        }
        
        console.log('[Dashboard] Final processed data:', JSON.stringify(processedSystemData, null, 2))
        setStats(processedSystemData)
      } else {
        const errorData = await statsRes.json().catch(() => ({}))
        console.error('Stats response not ok:', statsRes.status, errorData)
        
        if (statsRes.status === 400 && errorData.needsConfiguration) {
          setError(`Configuração do MikroTik incompleta: ${errorData.error}`)
        } else {
          setError('Erro ao carregar estatísticas do MikroTik')
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Erro ao carregar dados do MikroTik. Verifique a conexão.')
    }
  }, [mikrotikId, session?.access_token, baseUrl])

  const fetchUsers = useCallback(async () => {
    if (!mikrotikId || !session?.access_token) return

    try {
      console.log(`[FETCH-USERS] Iniciando busca de usuários para MikroTik ${mikrotikId}`)
      const usersRes = await fetch(`${baseUrl}/api/mikrotik/hotspot/users/${mikrotikId}`, { headers })
      
      console.log(`[FETCH-USERS] Status da resposta: ${usersRes.status}`)
      
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        console.log(`[FETCH-USERS] Dados recebidos:`, usersData)
        console.log(`[FETCH-USERS] Tipo de usersData.data:`, typeof usersData.data)
        console.log(`[FETCH-USERS] É array?:`, Array.isArray(usersData.data))
        console.log(`[FETCH-USERS] Contagem:`, usersData.count)
        
        // Garantir que sempre seja um array
        const userData = usersData.data || []
        if (!Array.isArray(userData)) {
          console.error(`[FETCH-USERS] ERRO: userData não é um array:`, userData)
          setUsers([])
        } else {
          console.log(`[FETCH-USERS] Definindo ${userData.length} usuários`)
          setUsers(userData)
        }
      } else {
        const errorData = await usersRes.text()
        console.error(`[FETCH-USERS] Erro na resposta: ${usersRes.status} - ${errorData}`)
        setUsers([])
      }
    } catch (error) {
      console.error('[FETCH-USERS] Erro na requisição:', error)
      setUsers([])
    }
  }, [mikrotikId, session?.access_token, baseUrl])

  const fetchActiveUsers = useCallback(async () => {
    if (!mikrotikId || !session?.access_token) return

    try {
      const activeUsersRes = await fetch(`${baseUrl}/api/mikrotik/hotspot/active-users/${mikrotikId}`, { headers })
      if (activeUsersRes.ok) {
        const activeUsersData = await activeUsersRes.json()
        setActiveUsers(activeUsersData.data || [])
      }
    } catch (error) {
      console.error('Error fetching active users:', error)
    }
  }, [mikrotikId, session?.access_token, baseUrl])

  const fetchProfiles = useCallback(async () => {
    if (!mikrotikId || !session?.access_token) return

    try {
      const profilesRes = await fetch(`${baseUrl}/api/mikrotik/hotspot/profiles/${mikrotikId}`, { headers })
      
      if (profilesRes.ok) {
        const profilesData = await profilesRes.json()
        const mikrotikProfiles = profilesData.data || []
        
        let supabasePlansData: any[] = []
        try {
          const supabasePlansRes = await fetch(`${baseUrl}/api/planos?mikrotik_id=${mikrotikId}`, { headers })
          if (supabasePlansRes.ok) {
            const plansData = await supabasePlansRes.json()
            supabasePlansData = plansData.data || []
            setSupabasePlans(supabasePlansData)
          }
        } catch (error) {
          console.error('Error parsing planos response:', error)
          setSupabasePlans([])
        }
        
        const enhancedProfiles = mikrotikProfiles.map((profile: any) => {
          const matchingPlan = supabasePlansData.find(plan => plan.nome === profile.name)
          return {
            ...profile,
            inDatabase: !!matchingPlan,
            supabaseId: matchingPlan?.id,
            valor: matchingPlan?.valor || profile.valor
          }
        })
        
        setProfiles(enhancedProfiles)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    }
  }, [mikrotikId, session?.access_token, baseUrl])

  const fetchServers = useCallback(async () => {
    if (!mikrotikId || !session?.access_token) return

    try {
      const serversRes = await fetch(`${baseUrl}/api/mikrotik/hotspot/servers/${mikrotikId}`, { headers })
      if (serversRes.ok) {
        const serversData = await serversRes.json()
        setServers(serversData.data || [])
      }
    } catch (error) {
      console.error('Error fetching servers:', error)
    }
  }, [mikrotikId, session?.access_token, baseUrl])

  const fetchServerProfiles = useCallback(async () => {
    if (!mikrotikId || !session?.access_token) return

    try {
      const serverProfilesRes = await fetch(`${baseUrl}/api/mikrotik/hotspot/server-profiles/${mikrotikId}`, { headers })
      if (serverProfilesRes.ok) {
        const serverProfilesData = await serverProfilesRes.json()
        setServerProfiles(serverProfilesData.data || [])
      }
    } catch (error) {
      console.error('Error fetching server profiles:', error)
    }
  }, [mikrotikId, session?.access_token, baseUrl])

  const fetchTemplates = useCallback(async () => {
    if (!session?.access_token) {
      console.log('[FETCH-TEMPLATES] Token não disponível')
      setTemplatesLoading(false)
      return
    }

    // If already cached, don't fetch again
    if (templatesCached && templates.length > 0) {
      console.log('[FETCH-TEMPLATES] Templates já em cache')
      return
    }

    try {
      setTemplatesLoading(true)
      
      // Retry mechanism with exponential backoff
      let attempts = 0
      const maxAttempts = 3
      
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(`${baseUrl}/api/mikrotik/templates`, { 
            headers,
            method: 'GET'
          })
          
          if (response.ok) {
            const data = await response.json()
            setTemplates(data.data || [])
            setTemplatesCached(true)
            console.log('[FETCH-TEMPLATES] Templates carregados:', data.data?.length || 0)
            console.log('[FETCH-TEMPLATES] Template data:', data.data)
            return // Success, exit retry loop
          } else {
            const errorText = await response.text()
            console.warn('[FETCH-TEMPLATES] Erro ao carregar templates:', response.status, errorText)
            
            if (response.status === 429) {
              // Rate limit, wait longer
              await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempts)))
            } else {
              break // Not a rate limit error, don't retry
            }
          }
        } catch (fetchError) {
          console.error('[FETCH-TEMPLATES] Erro na requisição (tentativa ' + (attempts + 1) + '):', fetchError)
          if (attempts < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)))
          }
        }
        
        attempts++
      }
      
      if (attempts >= maxAttempts) {
        console.error('[FETCH-TEMPLATES] Máximo de tentativas excedido')
        setTemplates([])
      }
    } catch (error) {
      console.error('[FETCH-TEMPLATES] Erro geral:', error)
      setTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }, [session?.access_token, baseUrl, headers, templatesCached, templates.length])

  const fetchData = useCallback(async () => {
    if (!mikrotikId || !session?.access_token) return

    try {
      setLoading(true)
      setError(null)

      // Fetch data sequentially with delays to avoid rate limiting
      await fetchStats()
      await new Promise(resolve => setTimeout(resolve, 300))
      
      await fetchUsers()
      await new Promise(resolve => setTimeout(resolve, 300))
      
      await fetchActiveUsers()
      await new Promise(resolve => setTimeout(resolve, 300))
      
      await fetchProfiles()
      await new Promise(resolve => setTimeout(resolve, 300))
      
      await fetchServers()
      await new Promise(resolve => setTimeout(resolve, 300))
      
      await fetchServerProfiles()
      
      // Templates são carregados apenas quando necessário (quando o usuário acessa a aba)


    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Erro ao carregar dados do MikroTik. Verifique a conexão.')
    } finally {
      setLoading(false)
    }
  }, [fetchStats, fetchUsers, fetchActiveUsers, fetchProfiles, fetchServers, fetchServerProfiles])

  // Function to fetch CPU and Memory data only
  const fetchCpuMemoryData = useCallback(async () => {
    if (!mikrotikId || !session?.access_token) return

    try {
      const response = await fetch(`${baseUrl}/api/mikrotik/cpu-memory/${mikrotikId}`, { headers })
      
      if (response.ok) {
        const data = await response.json()
        setCpuMemoryData(data.data)
        
        // Update stats resource data if stats exists - preserva routerboard e outros dados
        setStats(prev => prev ? ({
          ...prev,
          resource: {
            ...prev.resource,
            'cpu-load': data.data.cpu.percentage.toString(), // Não adiciona % aqui pois a função getCpuInfo já adiciona
            'total-memory': data.data.memory.total.toString(),
            'free-memory': data.data.memory.free.toString()
          }
          // Preserva routerboard, identity e outros dados importantes
        }) : null)
      }
    } catch (error) {
      console.error('Error fetching CPU/Memory data:', error)
    }
  }, [mikrotikId, session?.access_token, baseUrl])

  // Load all data on component mount
  useEffect(() => {
    if (!mikrotikId || !session?.access_token || dataLoaded) return

    const loadInitialData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch data sequentially with delays to avoid rate limiting
        // Criar funções inline para evitar dependencies loops
        
        // Stats
        try {
          const statsResponse = await fetch(`${baseUrl}/api/mikrotik/essential-info/${mikrotikId}`, { headers })
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            setStats(statsData.data)
          }
        } catch (e) { console.error('Error fetching stats:', e) }
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Users
        try {
          const usersResponse = await fetch(`${baseUrl}/api/mikrotik/hotspot/users/${mikrotikId}`, { headers })
          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            setUsers(usersData.data || [])
          }
        } catch (e) { console.error('Error fetching users:', e) }
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Active Users
        try {
          const activeUsersResponse = await fetch(`${baseUrl}/api/mikrotik/hotspot/active-users/${mikrotikId}`, { headers })
          if (activeUsersResponse.ok) {
            const activeUsersData = await activeUsersResponse.json()
            setActiveUsers(activeUsersData.data || [])
          }
        } catch (e) { console.error('Error fetching active users:', e) }
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Profiles
        try {
          const profilesResponse = await fetch(`${baseUrl}/api/mikrotik/hotspot/profiles/${mikrotikId}`, { headers })
          if (profilesResponse.ok) {
            const profilesData = await profilesResponse.json()
            setProfiles(profilesData.data || [])
          }
        } catch (e) { console.error('Error fetching profiles:', e) }
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Servers
        try {
          const serversResponse = await fetch(`${baseUrl}/api/mikrotik/hotspot/servers/${mikrotikId}`, { headers })
          if (serversResponse.ok) {
            const serversData = await serversResponse.json()
            setServers(serversData.data || [])
          }
        } catch (e) { console.error('Error fetching servers:', e) }
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Server Profiles
        try {
          const serverProfilesResponse = await fetch(`${baseUrl}/api/mikrotik/hotspot/server-profiles/${mikrotikId}`, { headers })
          if (serverProfilesResponse.ok) {
            const serverProfilesData = await serverProfilesResponse.json()
            setServerProfiles(serverProfilesData.data || [])
          }
        } catch (e) { console.error('Error fetching server profiles:', e) }
        
        // Templates são carregados apenas quando necessário
        
      } catch (error) {
        console.error('Error loading initial data:', error)
        setError('Erro ao carregar dados do MikroTik. Verifique a conexão.')
      } finally {
        setLoading(false)
        setDataLoaded(true)
      }
    }

    loadInitialData()
  }, [mikrotikId, session?.access_token, baseUrl, dataLoaded])

  // Auto-update CPU/Memory every 15 seconds - só começa após carregamento inicial
  useEffect(() => {
    if (!mikrotikId || !session?.access_token || loading) return

    // Só inicia a atualização automática se a página não estiver carregando
    // Initial CPU/Memory fetch after 5 seconds (tempo para dados iniciais carregarem)
    const timeoutId = setTimeout(() => {
      fetchCpuMemoryData()
    }, 5000)

    // Set up interval for automatic updates
    const interval = setInterval(() => {
      fetchCpuMemoryData()
    }, 30000) // 30 seconds to reduce API calls

    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [mikrotikId, session?.access_token, loading, fetchCpuMemoryData])

  // Modal handlers
  const openModal = (type: keyof typeof modals, item?: any) => {
    setModals(prev => ({ ...prev, [type]: true }))
    if (item) {
      setEditingItems(prev => ({ ...prev, [type]: item }))
    } else {
      setEditingItems(prev => ({ ...prev, [type]: null }))
    }
  }

  const closeModal = (type: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [type]: false }))
    setEditingItems(prev => ({ ...prev, [type]: null }))
  }

  // User handlers
  const handleCreateUser = () => openModal('user')
  const handleEditUser = (user: HotspotUser) => openModal('user', user)
  
  const handleUserSubmit = async (userData: any) => {
    try {
      const url = editingItems.user 
        ? `${baseUrl}/api/mikrotik/hotspot/users/${mikrotikId}/${editingItems.user['.id']}`
        : `${baseUrl}/api/mikrotik/hotspot/users/${mikrotikId}`
      
      const method = editingItems.user ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        closeModal('user')
        await fetchUsers() // Refresh only users data
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: editingItems.user ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!'
        })
      } else {
        throw new Error('Erro ao salvar usuário')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao salvar usuário: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  const handleDeleteUser = async (user: HotspotUser) => {
    if (!window.confirm(`Tem certeza que deseja deletar o usuário "${user.name}"?`)) return

    try {
      const response = await fetch(`${baseUrl}/api/mikrotik/hotspot/users/${mikrotikId}/${user['.id']}`, {
        method: 'DELETE',
        headers
      })

      if (response.ok) {
        await fetchUsers()
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: 'Usuário deletado com sucesso!'
        })
      } else {
        throw new Error('Erro ao deletar usuário')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao deletar usuário: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  const handleToggleUser = async (user: HotspotUser) => {
    try {
      // Helper function to check if user is currently active
      const isCurrentlyActive = () => {
        if (typeof user.disabled === 'string') {
          return user.disabled !== 'true' && user.disabled !== 'yes'
        }
        return !user.disabled
      }

      const currentlyActive = isCurrentlyActive()
      const newDisabledState = currentlyActive // If currently active, we want to disable (set disabled=true)

      const { password: mikrotikPassword, ...otherMikrotikParams } = getMikrotikParams()
      
      // Use the correct URL format with path parameters
      const response = await fetch(`${baseUrl}/api/mikrotik/hotspot/users/${mikrotikId}/${user['.id']}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          name: user.name,
          password: user.password,
          profile: user.profile,
          comment: user.comment,
          disabled: newDisabledState,
          mikrotik_password: mikrotikPassword,
          ...otherMikrotikParams
        })
      })

      if (response.ok) {
        await fetchUsers()
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: `Usuário ${currentlyActive ? 'desativado' : 'ativado'} com sucesso!`
        })
      } else {
        const errorData = await response.text()
        console.error('API Error Response:', errorData)
        throw new Error(`Erro ao alterar status do usuário: ${response.status}`)
      }
    } catch (error) {
      console.error('Error toggling user:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao alterar status: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  // Generate Passwords handler
  const handleGeneratePasswords = async (generatedUsers: GeneratedUser[]) => {
    try {
      console.log(`[GENERATE-PASSWORDS] Iniciando criação de ${generatedUsers.length} usuários em lote`)
      
      // Formatar usuários para API
      const { password: _pw, ...mikrotikParamsWithoutPassword } = getMikrotikParams()
      const usersForAPI = formatUsersForAPI(generatedUsers, mikrotikParamsWithoutPassword)
      
      // Fazer requisição para endpoint de geração em lote
      const response = await fetch(`${baseUrl}/api/mikrotik/hotspot/users/bulk/${mikrotikId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          users: usersForAPI,
          options: {
            maxUsers: 500,
            batchSize: 10,
            delayBetweenBatches: 500
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Atualizar lista de usuários
        await fetchUsers()
        
        // Mostrar toast de sucesso
        const summary = result.data?.summary
        if (summary) {
          addToast({
            type: summary.created === summary.total ? 'success' : 'warning',
            title: summary.created === summary.total ? 'Sucesso Total!' : 'Sucesso Parcial',
            description: `${summary.created} de ${summary.total} usuários criados (${summary.successRate})`
          })
          
          // Se houve erros, mostrar detalhes
          if (summary.failed > 0 && result.data?.errors?.length > 0) {
            console.warn('[GENERATE-PASSWORDS] Erros encontrados:', result.data.errors)
          }
        } else {
          addToast({
            type: 'success',
            title: 'Usuários Criados!',
            description: `${generatedUsers.length} usuários foram criados com sucesso`
          })
        }
      } else {
        throw new Error(result.message || result.error || 'Erro na criação em lote')
      }
      
    } catch (error) {
      console.error('[GENERATE-PASSWORDS] Erro na criação em lote:', error)
      
      let errorTitle = 'Erro na Geração'
      let errorMessage = 'Erro desconhecido'
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorTitle = 'Erro de Conexão'
          errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
        } else if (error.message.includes('timeout')) {
          errorTitle = 'Timeout'
          errorMessage = 'Operação demorou muito tempo. Alguns usuários podem ter sido criados.'
        } else {
          errorMessage = error.message
        }
      }
      
      addToast({
        type: 'error',
        title: errorTitle,
        description: errorMessage
      })
      
      // Atualizar lista mesmo em caso de erro (pode ter criado alguns)
      await fetchUsers()
    }
  }

  // Print Passwords handler
  const handlePrintPasswords = () => {
    setShowPrintModal(true)
  }

  // Profile handlers
  const handleCreateProfile = () => openModal('profile')
  const handleEditProfile = (profile: HotspotProfile) => openModal('profile', profile)
  
  const handleProfileSubmit = async (profileData: any) => {
    try {
      console.log('Profile submit data:', profileData)
      console.log('Editing profile info:', editingItems.profile)
      
      if (editingItems.profile) {
        // Update existing profile
        if (profileData.inDatabase && profileData.supabaseId) {
          // Update in Supabase (which will also update MikroTik)
          console.log('Updating synchronized plan in Supabase:', profileData.supabaseId)
          
          // Parse session timeout to minutes if it's in seconds
          let minutos = null
          if (profileData.session_timeout) {
            const timeoutSeconds = parseInt(profileData.session_timeout)
            if (!isNaN(timeoutSeconds)) {
              minutos = Math.floor(timeoutSeconds / 60)
            }
          }
          
          const response = await fetch(`${baseUrl}/api/planos/${profileData.supabaseId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            body: JSON.stringify({
              mikrotik_id: mikrotikId,
              nome: profileData.name,
              valor: parseFloat(profileData.valor),
              descricao: `Plano ${profileData.name}`,
              rate_limit: profileData.rate_limit,
              session_timeout: profileData.session_timeout,
              idle_timeout: profileData.idle_timeout,
              velocidade_upload: profileData.rate_limit?.split('/')[0] || null,
              velocidade_download: profileData.rate_limit?.split('/')[1] || null,
              minutos: minutos,
              ativo: !profileData.disabled,
              comment: profileData.comment
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Update synchronized plan error:', { status: response.status, body: errorText })
            throw new Error(`Erro ao atualizar plano no banco de dados: ${response.status} - ${errorText}`)
          }
          
          const responseData = await response.json()
          console.log('Update synchronized plan success:', responseData)
        } else {
          // Update only in MikroTik
          console.log('Updating MikroTik-only plan:', editingItems.profile['.id'])
          
          // Adicionar parâmetros de conexão na query string
          // Não é necessário enviar parâmetros adicionais; rota usa Mikrotik ID e credenciais no servidor
          
          const response = await fetch(`${baseUrl}/api/mikrotik/hotspot/profiles/${mikrotikId}/${editingItems.profile['.id']}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            body: JSON.stringify({
              name: profileData.name,
              'rate-limit': profileData.rate_limit || '',
              'session-timeout': profileData.session_timeout || '',
              'idle-timeout': profileData.idle_timeout || '',
              comment: profileData.comment || '',
              disabled: profileData.disabled || false
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Update MikroTik profile error:', { status: response.status, body: errorText })
            throw new Error(`Erro ao atualizar plano no MikroTik: ${response.status}`)
          }
        }
      } else {
        // Create new profile
        console.log('Creating new plan')
        const response = await fetch(`${baseUrl}/api/planos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: JSON.stringify({
            mikrotik_id: mikrotikId,
            nome: profileData.name,
            valor: parseFloat(profileData.valor),
            descricao: `Plano ${profileData.name}`,
            rate_limit: profileData.rate_limit,
            session_timeout: profileData.session_timeout,
            idle_timeout: profileData.idle_timeout,
            comment: profileData.comment,
            ativo: !profileData.disabled
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Create plan error:', { status: response.status, body: errorText })
          throw new Error(`Erro ao criar plano: ${response.status}`)
        }
      }

      closeModal('profile')
      await fetchProfiles()
      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: editingItems.profile ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!'
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao salvar plano: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  const handleDeleteProfile = async (profile: HotspotProfile) => {
    if (!window.confirm(`Tem certeza que deseja deletar o plano "${profile.name}"?`)) return

    try {
      if (profile.inDatabase && profile.supabaseId) {
        const response = await fetch(`${baseUrl}/api/planos/${profile.supabaseId}`, {
          method: 'DELETE',
          headers
        })
        if (!response.ok) throw new Error('Erro ao deletar plano do banco de dados')
      } else {
        const response = await fetch(`${baseUrl}/api/mikrotik/hotspot/profiles/${mikrotikId}/${profile['.id']}`, {
          method: 'DELETE',
          headers
        })
        if (!response.ok) throw new Error('Erro ao deletar plano do MikroTik')
      }

      await fetchProfiles()
      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'Plano deletado com sucesso!'
      })
    } catch (error) {
      console.error('Error deleting profile:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao deletar plano: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  const handleSyncProfile = async (profile: HotspotProfile, valor?: string) => {
    try {
      console.log('Starting profile sync:', { profileName: profile.name, valor, mikrotikId })
      
      // Get the value from user input or use existing value
      const valorNumerico = valor ? parseFloat(valor) : (profile.valor || 0)
      
      if (valorNumerico <= 0) {
        throw new Error('Valor deve ser maior que zero')
      }
      
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
        mikrotik_profile_id: profile['.id'] || profile.name // Use MikroTik ID
      }
      
      console.log('Profile payload:', profilePayload)
      
      if (existingPlan) {
        console.log('Updating existing plan:', existingPlan.id)
        // Update existing plan
        const response = await fetch(`${baseUrl}/api/planos/${existingPlan.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: JSON.stringify(profilePayload)
        })

        const responseText = await response.text()
        console.log('Update response:', { status: response.status, body: responseText })
        
        if (!response.ok) {
          throw new Error(`Erro ao atualizar plano existente: ${response.status} - ${responseText}`)
        }
        
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: 'Plano atualizado!'
        })
      } else {
        console.log('Syncing new plan to database')
        // Use the new sync endpoint
        const response = await fetch(`${baseUrl}/api/planos/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: JSON.stringify(profilePayload)
        })

        const responseText = await response.text()
        console.log('Sync response:', { status: response.status, body: responseText })
        
        if (!response.ok) {
          throw new Error(`Erro ao sincronizar plano: ${response.status} - ${responseText}`)
        }
        
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: 'Plano sincronizado!'
        })
      }

      // Refresh data to show updated sync status
      await fetchProfiles()
      
    } catch (error) {
      console.error('Error syncing profile:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao sincronizar plano: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  // Server handlers
  const handleCreateServer = () => openModal('server')
  const handleEditServer = (server: HotspotServer) => openModal('server', server)
  
  const handleServerSubmit = async (serverData: any) => {
    try {
      const url = editingItems.server 
        ? `${baseUrl}/api/mikrotik/hotspot/servers/${mikrotikId}/${editingItems.server['.id']}`
        : `${baseUrl}/api/mikrotik/hotspot/servers/${mikrotikId}`
      
      const method = editingItems.server ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          name: serverData.name,
          interface: serverData.interface,
          'address-pool': serverData.address_pool,
          profile: serverData.profile,
          comment: serverData.comment,
          disabled: serverData.disabled
        })
      })

      if (response.ok) {
        closeModal('server')
        await fetchServers()
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: editingItems.server ? 'Servidor atualizado com sucesso!' : 'Servidor criado com sucesso!'
        })
      } else {
        throw new Error('Erro ao salvar servidor')
      }
    } catch (error) {
      console.error('Error saving server:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao salvar servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  const handleDeleteServer = async (server: HotspotServer) => {
    if (!window.confirm(`Tem certeza que deseja deletar o servidor "${server.name}"?`)) return

    try {
      const response = await fetch(`${baseUrl}/api/mikrotik/hotspot/servers/${mikrotikId}/${server['.id']}`, {
        method: 'DELETE',
        headers
      })

      if (response.ok) {
        await fetchServers()
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: 'Servidor deletado com sucesso!'
        })
      } else {
        throw new Error('Erro ao deletar servidor')
      }
    } catch (error) {
      console.error('Error deleting server:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao deletar servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  // Server Profile handlers
  const handleCreateServerProfile = () => openModal('serverProfile')
  const handleEditServerProfile = (serverProfile: HotspotServerProfile) => openModal('serverProfile', serverProfile)
  
  const handleServerProfileSubmit = async (profileData: any) => {
    try {
      const url = editingItems.serverProfile 
        ? `${baseUrl}/api/mikrotik/hotspot/server-profiles/${mikrotikId}/${editingItems.serverProfile['.id']}`
        : `${baseUrl}/api/mikrotik/hotspot/server-profiles/${mikrotikId}`
      
      const method = editingItems.serverProfile ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          name: profileData.name,
          'html-directory': profileData.html_directory,
          'login-page': profileData.login_page,
          'split-user-domain': profileData.split_user_domain,
          comment: profileData.comment,
          disabled: profileData.disabled
        })
      })

      if (response.ok) {
        closeModal('serverProfile')
        await fetchServerProfiles()
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: editingItems.serverProfile ? 'Perfil atualizado com sucesso!' : 'Perfil criado com sucesso!'
        })
      } else {
        throw new Error('Erro ao salvar perfil de servidor')
      }
    } catch (error) {
      console.error('Error saving server profile:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao salvar perfil de servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  const handleDeleteServerProfile = async (serverProfile: HotspotServerProfile) => {
    if (!window.confirm(`Tem certeza que deseja deletar o perfil "${serverProfile.name}"?`)) return

    try {
      const response = await fetch(`${baseUrl}/api/mikrotik/hotspot/server-profiles/${mikrotikId}/${serverProfile['.id']}`, {
        method: 'DELETE',
        headers
      })

      if (response.ok) {
        await fetchServerProfiles()
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: 'Perfil deletado com sucesso!'
        })
      } else {
        throw new Error('Erro ao deletar perfil de servidor')
      }
    } catch (error) {
      console.error('Error deleting server profile:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao deletar perfil de servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  // Active user handlers
  const handleDisconnectUser = async (userId: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/mikrotik/hotspot/disconnect/${mikrotikId}/${userId}`, {
        method: 'POST',
        headers
      })

      if (response.ok) {
        await fetchActiveUsers()
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: 'Usuário desconectado com sucesso!'
        })
      } else {
        throw new Error('Erro ao desconectar usuário')
      }
    } catch (error) {
      console.error('Error disconnecting user:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao desconectar usuário: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  // Template handlers
  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template)
    // Initialize template variables with empty values
    const initialVariables: Record<string, string> = {}
    template.variables.forEach(variable => {
      initialVariables[variable.key] = ''
    })
    setTemplateVariables(initialVariables)
    setSelectedServerProfile('')
    setModals({ ...modals, templateProfile: true })
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !selectedServerProfile) {
      addToast({
        type: 'warning',
        title: 'Atenção!',
        description: 'Selecione um template e um perfil de servidor antes de continuar.'
      })
      return
    }

    // Verificar variáveis obrigatórias
    const missingVariables = selectedTemplate.variables
      .filter(v => v.required && !templateVariables[v.key])
      .map(v => v.label)
    
    if (missingVariables.length > 0) {
      addToast({
        type: 'warning',
        title: 'Campos obrigatórios!',
        description: `Preencha os campos: ${missingVariables.join(', ')}`
      })
      return
    }

    // Adicionar estado de loading
    setModals(prev => ({ ...prev, templateLoading: true }))

    try {
      addToast({
        type: 'info',
        title: 'Processando...',
        description: 'Aplicando template...'
      })

      // Primeiro, buscar o template HTML do servidor
      const templateResponse = await fetch(`${baseUrl}/api/mikrotik/templates/${selectedTemplate.id}/html`, {
        headers
      })
      
      if (!templateResponse.ok) {
        throw new Error('Erro ao carregar template HTML do servidor')
      }
      
      const templateData = await templateResponse.json()
      let templateContent = templateData.html || templateData.content || ''
      
      // Verificar se templateContent é válido
      if (!templateContent || typeof templateContent !== 'string') {
        throw new Error('Template HTML não encontrado ou inválido')
      }
      
      // Substituir todas as variáveis no template
      selectedTemplate.variables.forEach(variable => {
        const value = templateVariables[variable.key] || ''
        const placeholder = `{{${variable.key}}}`
        templateContent = templateContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
      })
      
      // Substituir variáveis automáticas do sistema
      templateContent = templateContent.replace(/{{MIKROTIK_ID}}/g, mikrotikId || '')
      templateContent = templateContent.replace(/{{API_URL}}/g, baseUrl || '')
      templateContent = templateContent.replace(/{{DEBUG_MODE}}/g, 'false')
      
      // Substituir variáveis específicas do template basic
      templateContent = templateContent.replace(/{{PRIMARY_COLOR}}/g, templateVariables.PRIMARY_COLOR || '#007bff')
      templateContent = templateContent.replace(/{{LOGO_ICON}}/g, templateVariables.LOGO_ICON || '📶')
      templateContent = templateContent.replace(/{{WELCOME_TITLE}}/g, templateVariables.WELCOME_TITLE || 'WiFi Gratuito')
      templateContent = templateContent.replace(/{{WELCOME_MESSAGE}}/g, templateVariables.WELCOME_MESSAGE || 'Conecte-se à internet')
      
      // Corrigir variáveis CSS vazias
      templateContent = templateContent.replace(/--primary:\s*;/g, '--primary: ' + (templateVariables.PRIMARY_COLOR || '#007bff') + ';')
      
      // Corrigir sintaxe JavaScript - DEBUG vazio
      templateContent = templateContent.replace(/DEBUG:\s*$/gm, 'DEBUG: false')
      templateContent = templateContent.replace(/DEBUG:\s*\/\//gm, 'DEBUG: false //')
      templateContent = templateContent.replace(/DEBUG:\s*\/\*.*?\*\//gm, 'DEBUG: false')
      
      // Corrigir outras variáveis JavaScript vazias (mas não URLs)
      templateContent = templateContent.replace(/:\s*;(?!\s*\/\/)/g, ': "";')
      templateContent = templateContent.replace(/:\s*\/\/(?![\w\.\-]+)/g, ': ""; //')
      
      console.log('[APPLY-TEMPLATE] Variáveis substituídas:', {
        mikrotikId: mikrotikId,
        apiUrl: baseUrl,
        primaryColor: templateVariables.PRIMARY_COLOR || '#007bff',
        logoIcon: templateVariables.LOGO_ICON || '📶',
        welcomeTitle: templateVariables.WELCOME_TITLE || 'WiFi Gratuito',
        welcomeMessage: templateVariables.WELCOME_MESSAGE || 'Conecte-se à internet'
      })
      
      console.log('[APPLY-TEMPLATE] Template processado:', templateContent.substring(0, 200) + '...')
      
      // Enviar template processado para o backend
      const response = await fetch(`${baseUrl}/api/mikrotik/templates/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          mikrotikId: mikrotikId,
          serverProfileId: selectedServerProfile,
          templateId: selectedTemplate.id,
          templateContent: templateContent,
          variables: templateVariables
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const result = await response.json()

      // Fechar modal e atualizar dados
      setModals(prev => ({ ...prev, templateProfile: false, templateLoading: false }))
      setSelectedTemplate(null)
      setTemplateVariables({})
      setSelectedServerProfile('')
      
      // Encontrar nome do server profile selecionado
      const selectedProfileName = serverProfiles.find(p => p['.id'] === selectedServerProfile)?.name || selectedServerProfile

      addToast({
        type: 'success',
        title: 'Template Aplicado!',
        description: 'Template enviado com sucesso!'
      })

      await fetchServerProfiles()
    } catch (error) {
      console.error('Erro ao aplicar template:', error)
      
      // Determinar tipo de erro e mensagem específica
      let errorMessage = 'Erro desconhecido'
      let errorTitle = 'Erro!'

      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorTitle = 'Erro de Conexão!'
          errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão de internet.'
        } else if (error.message.includes('hotspot directory')) {
          errorTitle = 'Erro no Diretório Hotspot!'
          errorMessage = 'Template enviado mas falha ao alterar diretório do hotspot. Verifique se existem perfis de servidor configurados.'
        } else if (error.message.includes('Server profile')) {
          errorTitle = 'Erro de Perfil!'
          errorMessage = 'Perfil de servidor não encontrado. Verifique se o perfil existe no MikroTik.'
        } else if (error.message.includes('MikroTik')) {
          errorTitle = 'Erro de Conexão MikroTik!'
          errorMessage = 'Falha na conexão com o MikroTik. Verifique as credenciais e conectividade.'
        } else {
          errorMessage = error.message
        }
      }

      setModals(prev => ({ ...prev, templateLoading: false }))
      
      addToast({
        type: 'error',
        title: errorTitle,
        description: errorMessage
      })
    }
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-black pt-16 lg:pt-0 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full mx-auto mb-6"
          />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 text-lg"
          >
            Carregando dashboard...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-16 lg:pt-0">
      {/* Header */}
      <div className="bg-black border-b border-gray-800 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/mikrotiks')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">
                {mikrotikInfo?.nome || 'MikroTik Dashboard'}
              </h1>
              <div className="text-gray-400 text-sm space-y-1">
                <p>{mikrotikInfo?.host} • {mikrotikInfo?.location}</p>
                {stats && (
                  <p className="text-green-400 font-medium">
                    {stats.routerboard?.model || stats.resource?.['board-name'] || 'RouterBoard'} • {stats.identity?.name || 'RouterOS'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </motion.button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Error Alert */}
        {error && (
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="flex-1">
                <p className="text-red-300">{error}</p>
                {error.includes('incompletas') && (
                  <p className="text-red-200 text-sm mt-2">
                    Configure o IP, usuário e senha do MikroTik para acessar o dashboard.{' '}
                    <Link 
                      to={`/mikrotiks/${mikrotikId}/edit`}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Editar configurações
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* CPU Card */}
          {stats ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group bg-black border border-gray-800 hover:border-blue-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.02] p-4 sm:p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">CPU</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-400">{getCpuInfo(stats).load}</p>
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-700"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-400"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${(() => {
                          const percentage = parseInt(getCpuInfo(stats).load.replace('%', ''))
                          return isNaN(percentage) ? 0 : percentage
                        })()}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-400">
                        {(() => {
                          const percentage = parseInt(getCpuInfo(stats).load.replace('%', ''))
                          return isNaN(percentage) ? '0' : percentage
                        })()}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 truncate">{getCpuInfo(stats).type}</p>
                <p className="text-xs text-gray-500 truncate">{getCpuInfo(stats).frequency}</p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600/20 rounded-lg animate-pulse">
                  <div className="h-5 w-5 bg-gray-700 rounded"></div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
                  <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                <div className="h-3 bg-gray-700 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Memory Card */}
          {stats ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group bg-black border border-gray-800 hover:border-green-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.02] p-4 sm:p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Server className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">Memória</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-green-400">{formatMemory(stats.resource?.['free-memory'])}</p>
                    <p className="text-sm text-gray-400">Livre</p>
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-700"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-green-400"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${(() => {
                          const total = parseInt(stats.resource?.['total-memory'] || '0')
                          const free = parseInt(stats.resource?.['free-memory'] || '0')
                          const used = total - free
                          return total > 0 ? Math.round((used / total) * 100) : 0
                        })()}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-400">
                        {(() => {
                          const total = parseInt(stats.resource?.['total-memory'] || '0')
                          const free = parseInt(stats.resource?.['free-memory'] || '0')
                          const used = total - free
                          return total > 0 ? Math.round((used / total) * 100) : 0
                        })()}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate">Total: {formatMemory(stats.resource?.['total-memory'])}</p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-600/20 rounded-lg animate-pulse">
                  <div className="h-5 w-5 bg-gray-700 rounded"></div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-20 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-6 bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse"></div>
                </div>
                <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Sistema Card */}
          {stats ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group bg-black border border-gray-800 hover:border-purple-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.02] p-4 sm:p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">Sistema</h3>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl font-bold text-purple-400 truncate">{getSystemInfo(stats).model}</p>
                <p className="text-sm text-gray-400 truncate">{getSystemInfo(stats).identity}</p>
                <p className="text-xs text-gray-500 truncate">{getSystemInfo(stats).version}</p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-600/20 rounded-lg animate-pulse">
                  <div className="h-5 w-5 bg-gray-700 rounded"></div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-20 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-700 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-28 animate-pulse"></div>
                <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Uptime Card */}
          {stats ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="group bg-black border border-gray-800 hover:border-orange-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.02] p-4 sm:p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-600/20 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">Uptime</h3>
              </div>
              <div className="space-y-2">
                <p className="text-lg sm:text-xl font-bold text-orange-400 truncate">{formatUptime(stats.resource?.uptime || stats.uptime)}</p>
                <p className="text-sm text-gray-400">Tempo ativo</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-green-400">Online</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-600/20 rounded-lg animate-pulse">
                  <div className="h-5 w-5 bg-gray-700 rounded"></div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-700 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="h-3 bg-gray-700 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="flex bg-black border border-gray-800 rounded-xl p-1 gap-1 overflow-x-auto scrollbar-hide shadow-lg">
              {[
                { id: 'overview', label: 'Visão Geral', icon: Database, shortLabel: 'Visão' },
                { id: 'users', label: 'Usuários', icon: Users, shortLabel: 'Users' },
                { id: 'active', label: 'Ativos', icon: UserCheck, shortLabel: 'Ativos' },
                { id: 'profiles', label: 'Planos', icon: Settings, shortLabel: 'Planos' },
                { id: 'servers', label: 'Servidores', icon: Server, shortLabel: 'Servers' },
                { id: 'server-profiles', label: 'Perfis de Servidor', icon: Database, shortLabel: 'Perfis' },
                { id: 'templates', label: 'Templates', icon: Settings, shortLabel: 'Templates' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id === 'templates' && !templatesCached && !templatesLoading) {
                      fetchTemplates()
                    }
                  }}
                  className={`group flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg scale-105' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-105'
                  }`}
                >
                  <tab.icon className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {/* Total Users */}
                {!loading ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="group bg-black border border-gray-800 hover:border-blue-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.02] p-4 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Users className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-white">{users.length}</p>
                        <p className="text-xs text-gray-400 truncate">Total Usuários</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-black border border-gray-800 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600/20 rounded-lg animate-pulse">
                        <div className="h-5 w-5 bg-gray-700 rounded"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="h-6 bg-gray-700 rounded w-8 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Users */}
                {!loading ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="group bg-black border border-gray-800 hover:border-green-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.02] p-4 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-600/20 rounded-lg">
                        <UserCheck className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-white">{activeUsers.length}</p>
                        <p className="text-xs text-gray-400 truncate">Clientes Ativos</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-black border border-gray-800 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-600/20 rounded-lg animate-pulse">
                        <div className="h-5 w-5 bg-gray-700 rounded"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="h-6 bg-gray-700 rounded w-8 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profiles */}
                {!loading ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="group bg-black border border-gray-800 hover:border-purple-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.02] p-4 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <Settings className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-white">{profiles.length}</p>
                        <p className="text-xs text-gray-400 truncate">Planos</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-black border border-gray-800 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg animate-pulse">
                        <div className="h-5 w-5 bg-gray-700 rounded"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="h-6 bg-gray-700 rounded w-8 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Servers */}
                {!loading ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="group bg-black border border-gray-800 hover:border-orange-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.02] p-4 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-600/20 rounded-lg">
                        <Server className="h-5 w-5 text-orange-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-white">{servers.length}</p>
                        <p className="text-xs text-gray-400 truncate">Servidores</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-black border border-gray-800 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-600/20 rounded-lg animate-pulse">
                        <div className="h-5 w-5 bg-gray-700 rounded"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="h-6 bg-gray-700 rounded w-8 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Server Profiles */}
                {!loading ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="group bg-black border border-gray-800 hover:border-cyan-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.02] p-4 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-600/20 rounded-lg">
                        <Database className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-white">{serverProfiles.length}</p>
                        <p className="text-xs text-gray-400 truncate">Perfis Servidor</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-black border border-gray-800 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-600/20 rounded-lg animate-pulse">
                        <div className="h-5 w-5 bg-gray-700 rounded"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="h-6 bg-gray-700 rounded w-8 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Activity */}
                {!loading ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="group bg-black border border-gray-800 hover:border-yellow-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.02] p-4 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-600/20 rounded-lg">
                        <UserCheck className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-white">{users.filter(u => !u.disabled).length}</p>
                        <p className="text-xs text-gray-400 truncate">Users Habilitados</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-black border border-gray-800 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-600/20 rounded-lg animate-pulse">
                        <div className="h-5 w-5 bg-gray-700 rounded"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="h-6 bg-gray-700 rounded w-8 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded w-28 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Template System */}
                <div className="group bg-black border border-gray-800 hover:border-purple-500 rounded-xl p-4 sm:p-6 hover:bg-gray-900/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700 group-hover:border-purple-500/50 transition-colors">
                      <FiLayout className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">Templates Hotspot</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 group-hover:text-gray-300 transition-colors">
                    Aplique templates personalizados às páginas de login do hotspot
                  </p>
                  <Button
                    onClick={() => {
                      setActiveTab('templates')
                      if (!templatesCached && !templatesLoading) {
                        fetchTemplates()
                      }
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base shadow-lg transition-all duration-300 group-hover:scale-105"
                  >
                    <FiLayout className="h-4 w-4 mr-2" />
                    Gerenciar Templates
                  </Button>
                </div>

                {/* System Management */}
                <div className="group bg-black border border-gray-800 hover:border-green-500 rounded-xl p-4 sm:p-6 hover:bg-gray-900/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700 group-hover:border-green-500/50 transition-colors">
                      <Server className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-white group-hover:text-green-400 transition-colors">Sistema</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 group-hover:text-gray-300 transition-colors">
                    Informações do sistema, interfaces e controles do MikroTik
                  </p>
                  <Button
                    onClick={() => setActiveTab('system')}
                    className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base shadow-lg transition-all duration-300 group-hover:scale-105"
                  >
                    <Server className="h-4 w-4 mr-2" />
                    Ver Sistema
                  </Button>
                </div>
              </div>

              {/* System Control */}
              <div className="group bg-black border border-gray-800 hover:border-red-500 rounded-xl p-4 sm:p-6 hover:bg-gray-900/50 transition-all duration-300 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700 group-hover:border-red-500/50 transition-colors">
                      <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-white group-hover:text-red-400 transition-colors">Controle do Sistema</h4>
                  </div>
                  <Button
                    onClick={async () => {
                      if (confirm('Tem certeza que deseja reiniciar o MikroTik? Esta ação pode interromper as conexões ativas.')) {
                        try {
                          const response = await fetch(`${baseUrl}/api/mikrotik/system/restart/${mikrotikId}`, {
                            method: 'POST',
                            headers
                          })
                          if (response.ok) {
                            addToast({
                              type: 'success',
                              title: 'MikroTik Reiniciado',
                              description: 'O sistema está sendo reiniciado. Aguarde alguns minutos para reconexão.'
                            })
                          }
                        } catch (error) {
                          addToast({
                            type: 'error',
                            title: 'Erro',
                            description: 'Falha ao reiniciar o MikroTik'
                          })
                        }
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto text-sm sm:text-base shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reiniciar MikroTik
                  </Button>
                </div>
                
                <div className="text-center py-6 sm:py-8 border border-gray-800 rounded-lg bg-gray-900/30">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-green-400 font-medium">Sistema Online</p>
                  </div>
                  <p className="text-gray-400 mb-2">Controle remoto do MikroTik</p>
                  <p className="text-sm text-gray-500">Use as abas acima para gerenciar usuários, planos e configurações</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <HotspotUsersTab
              users={users}
              profiles={profiles}
              onCreateUser={handleCreateUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onToggleUser={handleToggleUser}
              onGeneratePasswords={() => openModal('generatePasswords')}
              onPrintPasswords={handlePrintPasswords}
              loading={loading}
            />
          )}

          {activeTab === 'active' && (
            <ActiveUsersTab
              activeUsers={activeUsers}
              onDisconnectUser={handleDisconnectUser}
              onRefresh={fetchActiveUsers}
              loading={loading}
            />
          )}

          {activeTab === 'profiles' && (
            <HotspotProfilesTab
              profiles={profiles}
              onCreateProfile={handleCreateProfile}
              onEditProfile={handleEditProfile}
              onDeleteProfile={handleDeleteProfile}
              onSyncProfile={handleSyncProfile}
              loading={loading}
            />
          )}

          {activeTab === 'servers' && (
            <HotspotServersTab
              servers={servers}
              onCreateServer={handleCreateServer}
              onEditServer={handleEditServer}
              onDeleteServer={handleDeleteServer}
              loading={loading}
            />
          )}

          {activeTab === 'server-profiles' && (
            <HotspotServerProfilesTab
              serverProfiles={serverProfiles}
              onCreateServerProfile={handleCreateServerProfile}
              onEditServerProfile={handleEditServerProfile}
              onDeleteServerProfile={handleDeleteServerProfile}
              loading={loading}
            />
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Templates de Hotspot</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {templatesLoading ? 'Carregando templates...' : `${templates.length} templates disponíveis para personalização`}
                  </p>

                </div>
              </div>
              
              {templatesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden">
                      <div className="aspect-[16/10] bg-gray-800/50 animate-pulse"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-700/30 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 border border-gray-800 rounded-lg bg-gray-900/30">
                  <div className="text-gray-400 mb-4">
                    <FiLayout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhum template disponível</p>
                    <p className="text-sm text-gray-500 mt-2">Verifique a conexão com o servidor</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                  {templates.map((template, index) => {
                    console.log(`[TEMPLATE-RENDER] Template ${index}:`, template)
                    return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer"
                    onClick={() => handleUseTemplate(template)}
                  >
                    {/* Template Preview Image */}
                    <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                      <img
                        src={template.preview}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        crossOrigin="anonymous"
                        onLoad={() => console.log(`[TEMPLATE-IMAGE] Preview loaded successfully for ${template.name}: ${template.preview}`)}
                        onError={(e) => {
                          console.error(`[TEMPLATE-IMAGE-ERROR] Failed to load preview for ${template.name}: ${template.preview}`, e)
                          console.log(`[TEMPLATE-IMAGE-ERROR] Setting fallback image`)
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzNzQxNTE7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMWYyOTM3O3N0b3Atb3BhY2l0eToxIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSJ1cmwoI2dyYWQpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiPlByZXZpZXc8L3RleHQ+PC9zdmc+'
                        }}
                      />
                                             {/* Netflix-style gradient overlay */}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                      {/* Template info overlay - Netflix style */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0"
                      >
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-white drop-shadow-lg">{template.name}</h3>
                          <p className="text-sm text-gray-200/90 drop-shadow-md line-clamp-2">{template.description}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex gap-1">
                              {template.variables.slice(0, 4).map((_, i) => (
                                <div key={i} className="w-2 h-2 bg-blue-400 rounded-full shadow-lg"></div>
                              ))}
                              {template.variables.length > 4 && (
                                <span className="text-xs text-blue-300 ml-1">+{template.variables.length - 4}</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-300 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                              {template.variables.length} variáveis
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Bottom section */}
                    <div className="relative p-4">
                      <div className="group-hover:opacity-0 transition-opacity duration-300">
                        <h3 className="text-base font-semibold text-white truncate">{template.name}</h3>
                        <p className="text-sm text-gray-400 truncate mt-1">{template.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex gap-1">
                            {template.variables.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{template.variables.length} vars</span>
                        </div>
                      </div>
                    </div>

                    {/* Hover border effect */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-500/30 transition-all duration-500 pointer-events-none"></div>
                  </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        <UserModal
          isOpen={modals.user}
          onClose={() => closeModal('user')}
          onSubmit={handleUserSubmit}
          editingUser={editingItems.user}
          profiles={profiles}
          servers={servers}
          loading={loading}
        />

        <ProfileModal
          isOpen={modals.profile}
          onClose={() => closeModal('profile')}
          onSubmit={handleProfileSubmit}
          editingProfile={editingItems.profile}
          loading={loading}
        />

        <ServerModal
          isOpen={modals.server}
          onClose={() => closeModal('server')}
          onSubmit={handleServerSubmit}
          editingServer={editingItems.server}
          serverProfiles={serverProfiles}
          loading={loading}
        />

        <ServerProfileModal
          isOpen={modals.serverProfile}
          onClose={() => closeModal('serverProfile')}
          onSubmit={handleServerProfileSubmit}
          editingServerProfile={editingItems.serverProfile}
          loading={loading}
        />

        {/* Template Configuration Modal */}
        {modals.templateProfile && selectedTemplate && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Configurar Template</h2>
                    <p className="text-gray-400 text-sm mt-1">{selectedTemplate.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setModals(prev => ({ ...prev, templateProfile: false }))
                      setSelectedTemplate(null)
                      setTemplateVariables({})
                      setSelectedServerProfile('')
                    }}
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Server Profile Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Perfil de Servidor *
                    </label>
                    <select
                      value={selectedServerProfile}
                      onChange={(e) => setSelectedServerProfile(e.target.value)}
                      className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    >
                      <option value="">Selecione um perfil de servidor</option>
                      {serverProfiles.map(profile => (
                        <option key={profile['.id']} value={profile['.id']}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      O template será aplicado a este perfil de servidor
                    </p>
                  </div>

                  {/* Template Variables */}
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-white mb-4">Variáveis do Template</h3>
                    <div className="space-y-4">
                      {selectedTemplate.variables.map(variable => (
                        <div key={variable.key}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {variable.label}
                            {variable.required && <span className="text-red-400 ml-1">*</span>}
                          </label>
                          
                          {variable.type === 'color' ? (
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={templateVariables[variable.key] || ''}
                                onChange={(e) => setTemplateVariables(prev => ({
                                  ...prev,
                                  [variable.key]: e.target.value
                                }))}
                                className="w-12 sm:w-16 h-12 bg-black border border-gray-700 rounded-lg cursor-pointer"
                              />
                              <input
                                type="text"
                                value={templateVariables[variable.key] || ''}
                                onChange={(e) => setTemplateVariables(prev => ({
                                  ...prev,
                                  [variable.key]: e.target.value
                                }))}
                                className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                                placeholder={variable.placeholder}
                              />
                            </div>
                          ) : variable.type === 'number' ? (
                            <input
                              type="number"
                              value={templateVariables[variable.key] || ''}
                              onChange={(e) => setTemplateVariables(prev => ({
                                ...prev,
                                [variable.key]: e.target.value
                              }))}
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                              placeholder={variable.placeholder}
                              required={variable.required}
                            />
                          ) : variable.type === 'select' ? (
                            <select
                              value={templateVariables[variable.key] || ''}
                              onChange={(e) => setTemplateVariables(prev => ({
                                ...prev,
                                [variable.key]: e.target.value
                              }))}
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                              required={variable.required}
                            >
                              {variable.options?.map(option => (
                                <option key={option.value} value={option.value} className="bg-black text-white">
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={variable.type === 'url' ? 'url' : 'text'}
                              value={templateVariables[variable.key] || ''}
                              onChange={(e) => setTemplateVariables(prev => ({
                                ...prev,
                                [variable.key]: e.target.value
                              }))}
                              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                              placeholder={variable.placeholder}
                              required={variable.required}
                            />
                          )}
                          
                          <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-800">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setModals(prev => ({ ...prev, templateProfile: false }))
                        setSelectedTemplate(null)
                        setTemplateVariables({})
                        setSelectedServerProfile('')
                      }}
                      disabled={modals.templateLoading}
                      className="flex-1 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 hover:bg-gray-800 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleApplyTemplate}
                      disabled={!selectedServerProfile || (selectedTemplate.variables.some(v => v.required && !templateVariables[v.key])) || modals.templateLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {modals.templateLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Enviando...
                        </div>
                      ) : (
                        'Aplicar Template'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Loading Overlay */}
              {modals.templateLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                  <div className="bg-black/80 border border-gray-700 rounded-lg p-6 text-center">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <h3 className="text-white font-medium mb-2">Enviando Template</h3>
                    <p className="text-gray-400 text-sm">Por favor aguarde...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Print Passwords Modal */}
        <PrintPasswordsModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          users={users}
          profiles={profiles}
          mikrotikId={mikrotikId || ''}
          session={session}
        />

        {/* Generate Passwords Modal */}
        <GeneratePasswordsModal
          open={modals.generatePasswords}
          onOpenChange={(open) => setModals(prev => ({ ...prev, generatePasswords: open }))}
          profiles={profiles}
          existingUsers={users.map(u => u.name)}
          onGenerate={handleGeneratePasswords}
        />

        </div>
      </div>
    </div>
  )
}