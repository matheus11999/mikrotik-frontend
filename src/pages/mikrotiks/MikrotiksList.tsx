import { useEffect, useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Router, Plus, Edit, Trash2, Search, Users, Zap, Signal, RefreshCw, Eye, Copy, Check, Globe, Code, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { PlaceholdersAndVanishInput } from '../../components/ui/placeholders-and-vanish-input'
import { v4 as uuidv4 } from 'uuid'
import CreateMikrotikWithWireGuardModal from '../../components/modals/CreateMikrotikWithWireGuardModal'
import { api } from '../../config/api'
import { motion, AnimatePresence } from 'framer-motion'

// Componente para indicador circular
const CircularProgress = ({ value, label, color = "blue" }: { value: number, label: string, color?: string }) => {
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference
  
  const colorClasses = {
    blue: "text-blue-400",
    green: "text-green-400", 
    orange: "text-orange-400",
    red: "text-red-400"
  }
  
  const strokeColor = value > 80 ? "text-red-400" : value > 60 ? "text-orange-400" : "text-green-400"
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-gray-700"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={strokeColor}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </div>
  )
}

interface Mikrotik {
  id: string
  nome: string
  user_id: string
  porcentagem: number
  token?: string
  ip?: string
  username?: string
  password?: string
  port?: number
  ativo: boolean
  created_at: string
  wireguard_public_key?: string
  wireguard_private_key?: string
  wireguard_preshared_key?: string
  wireguard_allowed_subnets?: string
  wireguard_keepalive?: number
  wireguard_enabled?: boolean
  users?: {
    nome: string
    email: string
  }
}

interface MikrotikStats {
  cpuLoad?: string
  uptime?: string
  totalUsers?: number
  activeUsers?: number
  isOnline?: boolean
  error?: string
  lastChecked?: number
  responseTime?: number
  identity?: {
    name?: string
  }
  model?: string
  'cpu-load'?: string
  'free-memory'?: string
  'total-memory'?: string
  'board-name'?: string
  version?: string
  resource?: {
    'architecture-name'?: string
    'board-name'?: string
    'cpu-count'?: string
    'cpu-frequency'?: string
    'cpu-load'?: string
    'free-hdd-space'?: string
    'total-hdd-space'?: string
    version?: string
    cpu?: string
    platform?: string
  }
  routerboard?: {
    model?: string
    'serial-number'?: string
    'firmware-type'?: string
    'current-firmware'?: string
    routerboard?: string
  }
  data?: {
    resource?: {
      'board-name'?: string
      'cpu-load'?: string
      'free-memory'?: string
      'total-memory'?: string
      cpu?: string
      'cpu-frequency'?: string
      uptime?: string
      version?: string
    }
    routerboard?: {
      model?: string
      'serial-number'?: string
      'firmware-type'?: string
      'current-firmware'?: string
      routerboard?: string
    }
  }
}

// Funções auxiliares para calcular métricas
const parseCpuLoad = (cpuLoad?: string): number => {
  if (!cpuLoad) return 0
  const match = cpuLoad.match(/(\d+(?:\.\d+)?)%?/)
  return match ? Math.round(parseFloat(match[1])) : 0
}

const parseMemoryUsage = (freeMemory?: string, totalMemory?: string): { used: number, free: number, total: number, freeFormatted: string } => {
  const parseSize = (size?: string): number => {
    if (!size) return 0
    
    // Se é apenas um número (bytes), converte diretamente
    const numericValue = parseInt(size)
    if (!isNaN(numericValue) && size === numericValue.toString()) {
      return numericValue
    }
    
    // Se tem unidade, faz o parsing normal
    const match = size.match(/(\d+(?:\.\d+)?)\s*([KMGT]?i?B)/i)
    if (!match) return 0
    
    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()
    
    const multipliers: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'KIB': 1024,
      'MB': 1024 * 1024,
      'MIB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'GIB': 1024 * 1024 * 1024,
    }
    
    return value * (multipliers[unit] || 1)
  }
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
  
  const free = parseSize(freeMemory)
  const total = parseSize(totalMemory)
  const used = total - free
  
  return { 
    used, 
    free, 
    total, 
    freeFormatted: formatBytes(free)
  }
}

const parseStorageUsage = (freeStorage?: string, totalStorage?: string): { used: number, free: number, total: number, freeFormatted: string } => {
  const parseSize = (size?: string): number => {
    if (!size) return 0
    const sizeNum = parseInt(size)
    return isNaN(sizeNum) ? 0 : sizeNum
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const free = parseSize(freeStorage)
  const total = parseSize(totalStorage)
  const used = total - free

  return {
    used,
    free,
    total,
    freeFormatted: formatBytes(free)
  }
}

const formatUptime = (uptime?: string): string => {
  if (!uptime) return 'N/A'
  
  // Se já está no formato desejado (como "20h47m49s"), retorna como está
  if (uptime.includes('h') && uptime.includes('m') && uptime.includes('s')) {
    return uptime
  }
  
  // Se está em segundos, converte
  const seconds = parseInt(uptime)
  if (isNaN(seconds)) return uptime
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  return `${hours}h${minutes.toString().padStart(2, '0')}m${secs.toString().padStart(2, '0')}s`
}

export function MikrotiksList() {
  const { user, session } = useAuthContext()
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', porcentagem: '', user_id: '', token: '', ip: '', username: '', password: '', port: '8728' })
  const [userList, setUserList] = useState<any[]>([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editMikrotik, setEditMikrotik] = useState<Mikrotik | null>(null)
  const [mikrotikStats, setMikrotikStats] = useState<Record<string, MikrotikStats>>({})
  const [newCreateModalOpen, setNewCreateModalOpen] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [configCode, setConfigCode] = useState('')
  const [selectedMikrotikForConfig, setSelectedMikrotikForConfig] = useState<Mikrotik | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchMikrotiks()
    if (user?.role === 'admin') {
      fetchUsers()
    }
  }, [user])

  useEffect(() => {
    if (mikrotiks.length > 0) {
      fetchMikrotikStats()
    }
  }, [mikrotiks])

  const fetchMikrotiks = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('mikrotiks')
        .select(`
          *,
          users (
            nome,
            email
          )
        `)

      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setMikrotiks(data || [])
    } catch (error) {
      console.error('Error fetching mikrotiks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('id, nome, email').order('nome')
    if (!error && data) setUserList(data)
  }

  const fetchMikrotikStats = async () => {
    const activeMikrotiks = mikrotiks.filter(m => m.ativo && m.ip && m.username && m.password)
    
    // Set all as checking status first
    const checkingStats: Record<string, MikrotikStats> = {}
    activeMikrotiks.forEach(mikrotik => {
      checkingStats[mikrotik.id] = {
        isOnline: false,
        error: 'Verificando conexão...',
        lastChecked: Date.now()
      }
    })
    setMikrotikStats(prev => ({ ...prev, ...checkingStats }))
    
    // Check each MikroTik with retry logic
    const promises = activeMikrotiks.map(async (mikrotik) => {
      
      const checkConnection = async (attempt: number = 1): Promise<any> => {
        const startTime = Date.now()
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
          const headers = {
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'Content-Type': 'application/json'
          }
          
          console.log(`[MikrotiksList] Fetching stats for ${mikrotik.nome} (${mikrotik.id})`);
          
          const response = await fetch(`${baseUrl}/api/mikrotik/essential-info/${mikrotik.id}`, {
            method: 'GET',
            headers
          })
          
          if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`)
          }
          
          const data = await response.json()
          const responseTime = Date.now() - startTime
          
          console.log(`[MikrotiksList] Raw API response for ${mikrotik.nome}:`, JSON.stringify(data, null, 2));
          
          // Extract system data from the nested structure
          const resourceData = data.data?.resource || {}
          const identityData = data.data?.identity || {}
          const routerboardData = data.data?.routerboard || {}
          
          // Debug logs
          console.log(`[MikrotiksList] Resource data for ${mikrotik.nome}:`, JSON.stringify(resourceData, null, 2));
          console.log(`[MikrotiksList] Identity data for ${mikrotik.nome}:`, JSON.stringify(identityData, null, 2));
          console.log(`[MikrotiksList] Routerboard data for ${mikrotik.nome}:`, JSON.stringify(routerboardData, null, 2));
          console.log(`[MikrotiksList] Board name for ${mikrotik.nome}:`, resourceData['board-name']);
          console.log(`[MikrotiksList] Routerboard model for ${mikrotik.nome}:`, routerboardData.model);
          console.log(`[MikrotiksList] Device name for ${mikrotik.nome}:`, identityData.name);
          console.log(`[MikrotiksList] CPU info for ${mikrotik.nome}:`, {
            cpu: resourceData.cpu,
            cpuFrequency: resourceData['cpu-frequency'],
            cpuLoad: resourceData['cpu-load']
          });
          
          const result = {
            id: mikrotik.id,
            stats: {
              isOnline: true,
              'cpu-load': resourceData['cpu-load'] || '0',
              'free-memory': resourceData['free-memory'] || '0',
              'total-memory': resourceData['total-memory'] || '0',
              uptime: resourceData.uptime || 'N/A',
              'board-name': resourceData['board-name'] || 'N/A',
              'device-name': identityData.name || mikrotik.nome,
              resource: {
                'board-name': resourceData['board-name'],
                'cpu-load': resourceData['cpu-load'],
                cpu: resourceData.cpu,
                'cpu-frequency': resourceData['cpu-frequency'],
                'free-hdd-space': resourceData['free-hdd-space'],
                'total-hdd-space': resourceData['total-hdd-space']
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
              },
              lastChecked: Date.now(),
              responseTime
            }
          };
          
          console.log(`[MikrotiksList] Final processed data for ${mikrotik.nome}:`, JSON.stringify(result, null, 2));
          return result;
        } catch (error) {
          console.error(`[MikrotiksList] Error fetching stats for ${mikrotik.nome}:`, error);
          return {
            id: mikrotik.id,
            stats: { error: true }
          };
        }
      }
      
      return checkConnection()
    })
    
    // Process results as they come in
    const results = await Promise.allSettled(promises)
    const newStats: Record<string, MikrotikStats> = {}
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        newStats[result.value.id] = result.value.stats
      }
    })
    
    setMikrotikStats(prev => ({ ...prev, ...newStats }))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este MikroTik?')) return

    try {
      const { error } = await supabase.from('mikrotiks').delete().eq('id', id)
      if (error) throw error
      
      setMikrotiks(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting mikrotik:', error)
      alert('Erro ao excluir MikroTik')
    }
  }

  const handleOpenModal = () => {
    if (user?.role === 'admin') fetchUsers();
    setForm({ nome: '', porcentagem: '', user_id: '', token: uuidv4(), ip: '', username: '', password: '', port: '8728' });
    setModalOpen(true);
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Corrigir user_id
    const userId = user?.role === 'admin' ? form.user_id : user?.id;

    // Validação básica
    if (!form.nome || !form.porcentagem || !userId || !form.ip || !form.username || !form.password) {
      alert('Preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    const now = new Date().toISOString();

    const { data: newMikrotik, error } = await supabase.from('mikrotiks').insert({
      nome: form.nome,
      porcentagem: parseFloat(form.porcentagem),
      user_id: userId,
      token: form.token,
      ip: form.ip,
      username: form.username,
      password: form.password,
      port: parseInt(form.port) || 8728,
      ativo: true,
      created_at: now,
      updated_at: now,
    }).select('id').single();

    if (error) {
      alert('Erro ao criar MikroTik: ' + error.message);
      setLoading(false);
      return;
    }


    setLoading(false);
    setModalOpen(false);
    fetchMikrotiks();
  }

  const handleOpenEditModal = (mikrotik: Mikrotik) => {
    if (user?.role === 'admin') fetchUsers();
    setEditMikrotik(mikrotik);
    setForm({
      nome: mikrotik.nome,
      porcentagem: mikrotik.porcentagem.toString(),
      user_id: mikrotik.user_id,
      token: mikrotik.token || '',
      ip: mikrotik.ip || '',
      username: mikrotik.username || '',
      password: mikrotik.password || '',
      port: mikrotik.port?.toString() || '8728',
    });
    setEditModalOpen(true);
  };

  const handleGenerateToken = async (mikrotik: Mikrotik) => {
    const newToken = uuidv4();
    const now = new Date().toISOString();
    const { error } = await supabase.from('mikrotiks').update({ token: newToken, updated_at: now }).eq('id', mikrotik.id);
    if (!error) {
      try {
        await navigator.clipboard.writeText(newToken);
        alert('Novo token gerado e copiado para a área de transferência.');
      } catch (_) {
        alert('Novo token gerado, mas não foi possível copiar automaticamente.');
      }
      fetchMikrotiks();
    }
  };

  const handleEditFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const userId = user?.role === 'admin' ? form.user_id : user?.id;
    if (!form.nome || !form.porcentagem || !userId || !form.ip || !form.username || !form.password) {
      alert('Preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }
    const now = new Date().toISOString();
    const { error } = await supabase.from('mikrotiks').update({
      nome: form.nome,
      porcentagem: parseFloat(form.porcentagem),
      user_id: userId,
      ip: form.ip,
      username: form.username,
      password: form.password,
      port: parseInt(form.port) || 8728,
      ativo: true,
      updated_at: now,
    }).eq('id', editMikrotik?.id);
    setLoading(false);
    if (error) {
      alert('Erro ao editar MikroTik: ' + error.message);
      return;
    }
    setEditModalOpen(false);
    setEditMikrotik(null);
    fetchMikrotiks();
  };

  const handleRestartMikrotik = async (mikrotikId: string) => {
    if (!confirm('Tem certeza que deseja reiniciar este MikroTik? Isso pode interromper temporariamente o serviço.')) return
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/mikrotik/system/restart/${mikrotikId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      })
      
      if (response.ok) {
        alert('Comando de reinicialização enviado com sucesso!')
        // Atualizar status após um tempo
        setTimeout(() => {
          fetchMikrotikStats()
        }, 5000)
      } else {
        throw new Error('Erro ao enviar comando de reinicialização')
      }
    } catch (error) {
      console.error('Error restarting mikrotik:', error)
      alert('Erro ao reiniciar MikroTik: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    }
  }

  const generateMikroTikInstallationCode = async (mikrotik: Mikrotik) => {
    const interfaceName = 'wg-client'
    const serverEndpoint = '193.181.208.141'
    const serverPort = '64326'
    
    // Se não tem dados do WireGuard, não pode gerar código
    if (!mikrotik.wireguard_private_key || !mikrotik.ip) {
      return `# ERRO: MikroTik não possui configuração WireGuard completa
# Para obter a configuração WireGuard:
# 1. Use o botão "Novo MikroTik" para criar um com WireGuard automático
# 2. Ou configure manualmente no WireRest em: http://193.181.208.141:8081

# Dados necessários:
# - Chave privada do peer: ${mikrotik.wireguard_private_key || 'NÃO CONFIGURADO'}
# - Chave pública do servidor: OBTER NO WIREREST
# - IP do peer: ${mikrotik.ip || 'NÃO CONFIGURADO'}
# - Chave pré-compartilhada: ${mikrotik.wireguard_preshared_key || 'NÃO CONFIGURADO'}`
    }
    
    // Obter chave pública do servidor WireRest via proxy
    let serverPublicKey = '[CHAVE_PUBLICA_DO_SERVIDOR]' // fallback
    try {
      const serverResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/mikrotik/wirerest/interface`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      })
      
      if (serverResponse.ok) {
        const serverData = await serverResponse.json()
        serverPublicKey = serverData.publicKey
      }
    } catch (error) {
      console.warn('Não foi possível obter chave pública do servidor')
    }
    
    return `/interface/wireguard
add name="${interfaceName}" private-key="${mikrotik.wireguard_private_key}" listen-port=64326 comment="Interface WireGuard cliente - Criado automaticamente"
/interface/wireguard/peers
add interface="${interfaceName}" public-key="${serverPublicKey}" preshared-key="${mikrotik.wireguard_preshared_key || ''}" allowed-address="0.0.0.0/0,::/0" endpoint-address="${serverEndpoint}" endpoint-port="${serverPort}" persistent-keepalive="${mikrotik.wireguard_keepalive || 25}s" comment="Peer servidor WireGuard - Criado automaticamente"
/ip/address
add address="${mikrotik.ip}/24" interface="${interfaceName}" comment="IP WireGuard tunnel - Criado automaticamente"
/ip/dns
set servers="1.1.1.1" allow-remote-requests=yes
/ip/route
add dst-address="0.0.0.0/0" gateway="${interfaceName}" distance=1 comment="Rota padrão via WireGuard - Criado automaticamente"
/ip/firewall/filter
add chain="input" protocol="udp" port="64326" action="accept" comment="Permitir WireGuard UDP - Criado automaticamente"
add chain="forward" out-interface="${interfaceName}" action="accept" comment="Permitir forward para WireGuard - Criado automaticamente"
add chain="forward" in-interface="${interfaceName}" action="accept" comment="Permitir forward do WireGuard - Criado automaticamente"
/ip/firewall/nat
add chain="srcnat" out-interface="${interfaceName}" action="masquerade" comment="NAT para WireGuard - Criado automaticamente"
/ip/firewall/mangle
add chain="prerouting" in-interface="${interfaceName}" action="mark-connection" new-connection-mark="wireguard-conn" comment="Marcar conexões WireGuard - Criado automaticamente"
add chain="prerouting" connection-mark="wireguard-conn" action="mark-packet" new-packet-mark="wireguard-packet" comment="Marcar pacotes WireGuard - Criado automaticamente"
/interface/wireguard
set [find name="${interfaceName}"] disabled=no`
  }

  const handleShowInstallationCode = async (mikrotik: Mikrotik) => {
    try {
      const code = await generateMikroTikInstallationCode(mikrotik)
      setConfigCode(code)
      setSelectedMikrotikForConfig(mikrotik)
      setConfigModalOpen(true)
    } catch (error) {
      console.error('Erro ao gerar código:', error)
      alert('Erro ao gerar código de instalação')
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(configCode)
      setCopiedConfig('copied')
      setTimeout(() => setCopiedConfig(null), 2000)
    } catch (error) {
      console.error('Erro ao copiar código:', error)
      alert('Erro ao copiar código')
    }
  }

  const filteredMikrotiks = mikrotiks.filter(mikrotik => {
        const searchMatch = (mikrotik.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (mikrotik.users?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      mikrotik.token?.includes(searchTerm)
    
    const statusMatch = activeFilter === 'all' || 
      (activeFilter === 'active' && mikrotik.ativo) ||
      (activeFilter === 'inactive' && !mikrotik.ativo)
    
    return searchMatch && statusMatch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-16 lg:pt-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6"
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="h-8 bg-gray-800/50 rounded-lg w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-800/30 rounded w-96 animate-pulse"></div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="h-64 bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-16 lg:pt-0">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm sticky top-0 lg:top-0 z-10"
      >
        <div className="px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20">
                <Router className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  MikroTiks
                </h1>
                <p className="text-gray-400">
                  Gerencie seus roteadores e configurações
                </p>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={fetchMikrotikStats} 
                  variant="outline" 
                  className="border-gray-700 text-gray-300 hover:text-white hover:border-orange-500/50 hover:bg-orange-500/10 transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => setNewCreateModalOpen(true)} 
                  className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" /> Novo MikroTik
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Search and Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Search Bar */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, usuário ou token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 sm:py-4 bg-black/40 backdrop-blur-sm border-gray-800/50 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl text-base sm:text-lg transition-all duration-200"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex justify-center">
              <div className="flex bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-1 gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeFilter === 'all'
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Todos ({mikrotiks.length})
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFilter('active')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeFilter === 'active'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Ativos ({mikrotiks.filter(m => m.ativo).length})
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFilter('inactive')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeFilter === 'inactive'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Inativos ({mikrotiks.filter(m => !m.ativo).length})
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* MikroTiks Grid */}
          {filteredMikrotiks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center py-16"
            >
              <div className="text-center max-w-md px-4">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="relative mb-8"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center backdrop-blur-sm">
                    <Router className="h-10 w-10 sm:h-12 sm:w-12 text-orange-400" />
                  </div>
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4"
                >
                  {mikrotiks.length === 0 ? 'Nenhum MikroTik cadastrado' : 'Nenhum resultado encontrado'}
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-gray-400 mb-8 text-base sm:text-lg"
                >
                  {mikrotiks.length === 0 
                    ? 'Comece criando seu primeiro MikroTik para gerenciar vendas e configurações'
                    : 'Tente ajustar os termos de busca para encontrar o que procura'
                  }
                </motion.p>
                {mikrotiks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button onClick={handleOpenModal} className="bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium shadow-lg transition-all duration-300 w-full sm:w-auto">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Criar Primeiro MikroTik
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredMikrotiks.map((mikrotik, index) => {
                const stats = mikrotikStats[mikrotik.id]
                const hasValidCredentials = mikrotik.ip && mikrotik.username && mikrotik.password
                const isConnected = stats?.isOnline || false
                
                // Calculate metrics
                const cpuLoad = parseCpuLoad(stats?.['cpu-load'])
                const memoryData = parseMemoryUsage(stats?.['free-memory'], stats?.['total-memory'])
                const memoryUsagePercent = memoryData.total > 0 ? Math.round((memoryData.used / memoryData.total) * 100) : 0
                const storageData = parseStorageUsage(stats?.resource?.['free-hdd-space'], stats?.resource?.['total-hdd-space'])
                const storageUsagePercent = storageData.total > 0 ? Math.round((storageData.used / storageData.total) * 100) : 0
                const formattedUptime = formatUptime(stats?.uptime)
                
                return (
                  <motion.div
                    key={mikrotik.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-orange-500/50 hover:bg-gray-900/30 rounded-2xl transition-all duration-300 cursor-pointer relative shadow-lg hover:shadow-2xl"
                  >
                    {/* Status indicators - Improved */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {/* Active Status */}
                      <div className={`w-3 h-3 rounded-full ${mikrotik.ativo ? 'bg-green-400' : 'bg-red-400'} shadow-lg`} title={mikrotik.ativo ? 'Ativo' : 'Inativo'}></div>
                      
                      {/* Connection Status - Only show if active and has credentials */}
                      {mikrotik.ativo && hasValidCredentials && (
                        <div 
                          className={`w-3 h-3 rounded-full shadow-lg ${
                            isConnected ? 'bg-blue-400' : 
                            stats?.error === 'Verificando conexão...' ? 'bg-yellow-400 animate-pulse' : 
                            'bg-red-400'
                          }`} 
                          title={
                            isConnected ? `Online ${stats?.responseTime ? `(${stats.responseTime}ms)` : ''}` : 
                            stats?.error === 'Verificando conexão...' ? 'Verificando...' :
                            stats?.error || 'Offline'
                          }
                        ></div>
                      )}
                      
                      {/* WireGuard Status */}
                      {mikrotik.wireguard_public_key && (
                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-lg" title="WireGuard Configurado"></div>
                      )}
                    </div>
                    
                    <div className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
                      <div className="flex items-start justify-between mb-2"> {/* Removed margin-right since buttons are moved */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 shrink-0">
                            <Signal className={`h-4 w-4 sm:h-5 sm:w-5 ${
                              mikrotik.ativo && isConnected ? 'text-green-400' : 
                              mikrotik.ativo ? 'text-blue-400' : 'text-gray-500'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">{mikrotik.nome}</h3>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${
                                mikrotik.ativo ? 
                                  isConnected ? 'text-green-400' : 
                                  stats?.error === 'Verificando conexão...' ? 'text-yellow-400' :
                                  'text-red-400'
                                  : 'text-red-400'
                              }`}>
                                {mikrotik.ativo ? 
                                  isConnected ? 'Online' : 
                                  stats?.error === 'Verificando conexão...' ? 'Verificando...' :
                                  hasValidCredentials ? 'Offline' : 'Sem credenciais'
                                  : 'Inativo'
                                }
                              </p>
                              {mikrotik.ativo && isConnected && (
                                <span className="text-xs text-gray-400">- {mikrotik.ip}</span>
                              )}
                            </div>
                            {/* Show error if offline */}
                            {stats?.error && !isConnected && stats.error !== 'Verificando conexão...' && (
                              <p className="text-xs text-red-400 truncate" title={stats.error}>
                                {stats.error}
                              </p>
                            )}

                          </div>
                        </div>
                      </div>
                      
                      {/* System Metrics */}
                      {isConnected ? (
                        <div className="flex items-center justify-center p-3 rounded-lg bg-black border border-gray-800">
                          <div className="flex gap-4">
                            <CircularProgress 
                              value={cpuLoad} 
                              label="CPU" 
                            />
                            <CircularProgress 
                              value={memoryUsagePercent} 
                              label="Memória" 
                            />
                            <CircularProgress 
                              value={storageUsagePercent} 
                              label="Disco" 
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-3 rounded-lg bg-black border border-gray-800">
                          <div className="flex items-center gap-2">
                            <div className="animate-pulse">
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            </div>
                            <div className="animate-pulse" style={{ animationDelay: '0.1s' }}>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            </div>
                            <div className="animate-pulse" style={{ animationDelay: '0.2s' }}>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-sm text-gray-400 ml-2">Carregando métricas</span>
                          </div>
                        </div>
                      )}

                      {/* System Info - Only show if online */}
                      {isConnected && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-black border border-gray-800 group hover:border-blue-500/50 transition-all duration-300">
                          <div className="flex items-center gap-3">
                            <Signal className="h-4 w-4 text-green-400 shrink-0 group-hover:text-green-300 transition-colors duration-300" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-green-400 truncate group-hover:text-green-300 transition-all duration-300 transform group-hover:scale-105">
                                {stats?.routerboard?.model || stats?.resource?.['board-name'] || 'N/A'}
                              </p>
                              <p className="text-xs text-blue-400 truncate group-hover:text-blue-300 transition-all duration-300 transform group-hover:translate-x-1">
                                {stats?.identity?.name || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-all duration-300 transform group-hover:scale-110">
                              {formattedUptime}
                            </p>
                            <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Uptime</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-800">
                        <Link to={`/mikrotiks/${mikrotik.id}/dashboard`} className="flex-1">
                          <Button variant="outline" className="w-full border-blue-600/50 text-blue-400 hover:text-blue-300 hover:border-blue-500 hover:bg-blue-500/10">
                            <Eye className="h-4 w-4 mr-2" />
                            Acessar
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-800 text-gray-300 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 p-2"
                          onClick={() => handleOpenEditModal(mikrotik)}
                          title="Editar MikroTik"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-600/50 text-red-400 hover:text-red-300 hover:border-red-500 hover:bg-red-500/10 p-2"
                          onClick={() => handleDelete(mikrotik.id)}
                          title="Deletar MikroTik"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-green-600/50 text-green-400 hover:text-green-300 hover:border-green-500 hover:bg-green-500/10 p-2"
                          onClick={() => handleShowInstallationCode(mikrotik)}
                          title="Ver código de instalação WireGuard"
                        >
                          <Code className="h-4 w-4" />
                        </Button>
                        {isConnected && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-orange-600/50 text-orange-400 hover:text-orange-300 hover:border-orange-500 hover:bg-orange-500/10 p-2"
                            onClick={() => handleRestartMikrotik(mikrotik.id)}
                            title="Reiniciar MikroTik"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </motion.div>
      </div>

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/75 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg h-[calc(100vh-2rem)] max-h-[700px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black border border-gray-800 p-6 sm:p-8 shadow-2xl overflow-y-auto">
            <Dialog.Title className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Adicionar MikroTik</Dialog.Title>
            <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nome do MikroTik</label>
                <PlaceholdersAndVanishInput
                  placeholders={["MikroTik Principal", "MikroTik Secundário", "MikroTik Loja", "MikroTik Casa"]}
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  name="nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Porcentagem de Comissão (%)</label>
                <input
                  type="number"
                  name="porcentagem"
                  value={form.porcentagem}
                  onChange={handleFormChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Endereço IP</label>
                <input
                  type="text"
                  name="ip"
                  value={form.ip}
                  onChange={handleFormChange}
                  placeholder="192.168.1.1"
                  className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Usuário</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleFormChange}
                  placeholder="admin"
                  className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Senha</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Porta (Opcional)</label>
                <input
                  type="number"
                  name="port"
                  value={form.port}
                  onChange={handleFormChange}
                  placeholder="8728"
                  min="1"
                  max="65535"
                  className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white text-base"
                />
              </div>
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Usuário Responsável</label>
                  <select
                    name="user_id"
                    value={form.user_id}
                    onChange={handleFormChange}
                    className="w-full p-3 bg-black border border-gray-800 text-white rounded-lg text-base"
                    required
                    disabled={userList.length === 0}
                  >
                    <option value="">{userList.length === 0 ? 'Carregando usuários...' : 'Selecione um usuário'}</option>
                    {userList.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Token de Acesso</label>
                <input
                  type="text"
                  name="token"
                  value={form.token}
                  readOnly
                  className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white opacity-70 cursor-not-allowed text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1 border-gray-800 text-gray-300 hover:text-white py-3">Cancelar</Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3">
                  {loading ? 'Salvando...' : 'Salvar MikroTik'}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={editModalOpen} onOpenChange={setEditModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/75 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg h-[calc(100vh-2rem)] max-h-[700px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black border border-gray-800 p-6 sm:p-8 shadow-2xl overflow-y-auto">
            <Dialog.Title className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Editar MikroTik</Dialog.Title>
            <form onSubmit={handleEditFormSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nome do MikroTik</label>
                <PlaceholdersAndVanishInput
                  placeholders={["MikroTik Principal", "MikroTik Secundário", "MikroTik Loja", "MikroTik Casa"]}
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  name="nome"
                />
              </div>
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Porcentagem de Comissão (%)</label>
                  <input
                    type="number"
                    name="porcentagem"
                    value={form.porcentagem}
                    onChange={handleFormChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white text-base"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Usuário</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleFormChange}
                  placeholder="admin"
                  className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Senha</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Porta (Opcional)</label>
                <input
                  type="number"
                  name="port"
                  value={form.port}
                  onChange={handleFormChange}
                  placeholder="8728"
                  min="1"
                  max="65535"
                  className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white text-base"
                />
              </div>
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Usuário Responsável</label>
                  <select
                    name="user_id"
                    value={form.user_id}
                    onChange={handleFormChange}
                    className="w-full p-3 bg-black border border-gray-800 text-white rounded-lg text-base"
                    required
                    disabled={userList.length === 0}
                  >
                    <option value="">{userList.length === 0 ? 'Carregando usuários...' : 'Selecione um usuário'}</option>
                    {userList.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} className="flex-1 border-gray-800 text-gray-300 hover:text-white py-3">Cancelar</Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* New Create MikroTik with WireGuard Modal */}
      <CreateMikrotikWithWireGuardModal
        isOpen={newCreateModalOpen}
        onClose={() => setNewCreateModalOpen(false)}
        onSuccess={fetchMikrotiks}
      />

      {/* Configuration Code Modal */}
      <Dialog.Root open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/75 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-4xl h-[calc(100vh-2rem)] max-h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black border border-gray-800 p-6 sm:p-8 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Dialog.Title className="text-lg sm:text-xl font-bold text-white">
                  Configuração WireGuard - {selectedMikrotikForConfig?.nome}
                </Dialog.Title>
                <p className="text-gray-400 text-sm mt-1">Código para configurar o MikroTik</p>
              </div>
              <button
                onClick={() => setConfigModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Tutorial */}
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-400" />
                  Como aplicar a configuração
                </h3>
                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                  <li>Copie todo o código abaixo clicando no botão "Copiar Código"</li>
                  <li>Abra seu WinBox e conecte ao MikroTik</li>
                  <li>Acesse o <strong>Terminal</strong> no menu lateral</li>
                  <li>Cole todo o código no terminal</li>
                  <li>Pressione <strong>Enter</strong> para executar</li>
                  <li>Aguarde a configuração ser aplicada</li>
                </ol>
              </div>

              {/* Code Display */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">Código de Configuração</h3>
                  <Button
                    onClick={handleCopyCode}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {copiedConfig === 'copied' ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Código
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">
                    {configCode}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-gray-800">
                <Button
                  variant="outline"
                  onClick={() => setConfigModalOpen(false)}
                  className="border-gray-700 text-gray-300 hover:text-white"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}