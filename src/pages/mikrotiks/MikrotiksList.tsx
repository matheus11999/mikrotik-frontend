import { useEffect, useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useToast } from '../../components/ui/toast'
import { ListLoading } from '../../components/ui'
import { Router, Plus, Edit, Trash2, Search, Users, Zap, Signal, RefreshCw, Eye, Copy, Check, Globe, Code, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { PlaceholdersAndVanishInput } from '../../components/ui/placeholders-and-vanish-input'
import { v4 as uuidv4 } from 'uuid'
import CreateMikrotikWithWireGuardModal from '../../components/modals/CreateMikrotikWithWireGuardModal'
import { api } from '../../config/api'

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
  const { addToast } = useToast()
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userList, setUserList] = useState<any[]>([])
  const [mikrotikStats, setMikrotikStats] = useState<Record<string, MikrotikStats>>({})
  const [newCreateModalOpen, setNewCreateModalOpen] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [configCode, setConfigCode] = useState('')
  const [selectedMikrotikForConfig, setSelectedMikrotikForConfig] = useState<Mikrotik | null>(null)
  const [showRemovalCode, setShowRemovalCode] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [deletingMikrotiks, setDeletingMikrotiks] = useState<Set<string>>(new Set())
  const [isScrolled, setIsScrolled] = useState(false)

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

  // Scroll detection for blur effect
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20
      setIsScrolled(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          const baseUrl = import.meta.env.VITE_API_URL || 'https://api.mikropix.online'
          const headers = {
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'Content-Type': 'application/json'
          }
          const endpoint = `${baseUrl}/api/mikrotik/essential-info/${mikrotik.id}`
          
          console.log(`[MikrotiksList] Fetching stats for ${mikrotik.nome} (${mikrotik.id}) from ${endpoint}`);
          
          // Create a timeout promise that rejects after 5 seconds
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Connection timeout after 5 seconds'))
            }, 5000)
          })
          
          // Race between fetch and timeout
          const fetchPromise = fetch(endpoint, {
            method: 'GET',
            headers
          })
          
          const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
          
          if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText} - Route: ${endpoint}`)
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
          const responseTime = Date.now() - startTime
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const isTimeout = errorMessage.includes('timeout')
          const is401 = (error as any)?.status === 401
          const is503 = (error as any)?.status === 503
          const is408 = (error as any)?.status === 408
          
          // Parse error from response if available
          let displayError = errorMessage
          if (isTimeout || is408) {
            displayError = 'Conexão expirou (5s)'
          } else if (is401) {
            displayError = 'Usuário/senha incorretos'
          } else if (is503) {
            displayError = 'Dispositivo offline'
          } else if (errorMessage.includes('incorretos')) {
            displayError = 'Credenciais inválidas'
          } else if (errorMessage.includes('offline')) {
            displayError = 'MikroTik offline'
          }
          
          console.error(`[MikrotiksList] Error fetching stats for ${mikrotik.nome}:`, {
            error: errorMessage,
            displayError,
            responseTime,
            endpoint: `${import.meta.env.VITE_API_URL || 'https://api.mikropix.online'}/api/mikrotik/essential-info/${mikrotik.id}`,
            isTimeout,
            status: (error as any)?.status
          });
          
          return {
            id: mikrotik.id,
            stats: { 
              isOnline: false,
              error: displayError,
              lastChecked: Date.now(),
              responseTime
            }
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
          if (!confirm('Tem certeza que deseja excluir este MikroTik? Isso também removerá a conexão Mikropix associada.')) return

    // Adicionar ao conjunto de MikroTiks sendo deletados
    setDeletingMikrotiks(prev => new Set(prev).add(id))

    try {
      // Primeiro, buscar o MikroTik para obter os dados do Mikropix
      const mikrotikToDelete = mikrotiks.find(m => m.id === id)
      
      // Se tem chave pública do Mikropix, deletar o peer primeiro
      if (mikrotikToDelete?.wireguard_public_key) {
        try {
          const token = session?.access_token || localStorage.getItem('token')
          const encodedPublicKey = encodeURIComponent(mikrotikToDelete.wireguard_public_key)
          
          console.log('Deletando peer Mikropix:', mikrotikToDelete.wireguard_public_key)
          
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.mikropix.online'}/api/mikrotik/wirerest/peers/${encodedPublicKey}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'accept': 'application/json'
            }
          })

          const data = await response.json()
          
          if (response.ok && data.success) {
            console.log('Peer Mikropix deletado com sucesso')
            // Limpar dados Mikropix do Supabase
            await clearWireGuardDataFromSupabase(mikrotikToDelete.id)
          } else {
            console.warn('Erro ao deletar peer Mikropix:', data.error)
            // Mesmo com erro, limpar dados Mikropix do Supabase já que o MikroTik será deletado
            await clearWireGuardDataFromSupabase(mikrotikToDelete.id)
          }
        } catch (error) {
          console.warn('Erro ao deletar peer Mikropix:', error)
          // Mesmo com erro, limpar dados Mikropix do Supabase já que o MikroTik será deletado
          await clearWireGuardDataFromSupabase(mikrotikToDelete.id)
        }
      }

      // Deletar o MikroTik do banco de dados
      const { error } = await supabase.from('mikrotiks').delete().eq('id', id)
      if (error) throw error
      
      setMikrotiks(prev => prev.filter(m => m.id !== id))
      
      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: `MikroTik "${mikrotikToDelete?.nome || 'N/A'}" removido com sucesso! ${mikrotikToDelete?.wireguard_public_key ? 'Conexão Mikropix também foi removida.' : ''}`
      })
    } catch (error) {
      console.error('Error deleting mikrotik:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao excluir MikroTik: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    } finally {
      // Remover do conjunto de MikroTiks sendo deletados
      setDeletingMikrotiks(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }



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


  const handleRestartMikrotik = async (mikrotikId: string) => {
    if (!confirm('Tem certeza que deseja reiniciar este MikroTik? Isso pode interromper temporariamente o serviço.')) return
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.mikropix.online'}/api/mikrotik/system/restart/${mikrotikId}`, {
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
    if (!mikrotik.wireguard_private_key || !mikrotik.ip) {
      return `ERRO: MikroTik não possui configuração Mikropix completa
Para obter a configuração Mikropix:
1. Use o botão "Novo MikroTik" para criar um com Mikropix automático
2. Ou configure manualmente no WireRest

Dados necessários:
- Chave privada do peer: ${mikrotik.wireguard_private_key || 'NÃO CONFIGURADO'}
- IP do peer: ${mikrotik.ip || 'NÃO CONFIGURADO'}
- Chave pré-compartilhada: ${mikrotik.wireguard_preshared_key || 'NÃO CONFIGURADO'}`
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.mikropix.online'
      const filename = `mikropix-complete-${mikrotik.nome.replace(/[^a-zA-Z0-9]/g, '_')}.rsc`
      
      // Código simples em uma linha que baixa e executa o arquivo completo
      const installationCode = `/tool fetch url="${apiUrl}/api/mikrotik/generate/install/${mikrotik.id}" dst-path="${filename}"; /import "${filename}"`
      
      return installationCode
    } catch (error) {
      console.error('Error generating code:', error)
      
      let serverPublicKey = '[CHAVE_PUBLICA_DO_SERVIDOR]'
      try {
        const serverResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.mikropix.online'}/api/mikrotik/wirerest/interface`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token || ''}`
          }
        })
        
        if (serverResponse.ok) {
          const serverData = await serverResponse.json()
          serverPublicKey = serverData.publicKey
        }
      } catch (err) {
        console.warn('Não foi possível obter chave pública do servidor')
      }

      const serverPort = 64326
      const serverIp = '193.181.208.141'

      return `/system clock set time-zone-name=America/Manaus
/system ntp client set enabled=yes mode=unicast servers=200.189.40.8,201.49.148.135
/ip dns set servers=1.1.1.1,8.8.8.8 allow-remote-requests=yes
/ip hotspot walled-garden add dst-host=api.mikropix.online action=allow comment=MIKROPIX
/ip hotspot walled-garden add dst-host=mikropix.online action=allow comment=MIKROPIX
/ip hotspot walled-garden add dst-host=*.mikropix.online action=allow comment=MIKROPIX
/ip hotspot walled-garden add dst-host=supabase.co action=allow comment=MIKROPIX
/ip hotspot walled-garden add dst-host=*.supabase.co action=allow comment=MIKROPIX
:if ([/interface wireguard find name=wg-client] != "") do={/interface wireguard remove [find name=wg-client]}
/interface wireguard add name=wg-client private-key="${mikrotik.wireguard_private_key}" listen-port=${serverPort} comment=MIKROPIX
/interface wireguard peers add interface=wg-client public-key="${serverPublicKey}" preshared-key="${mikrotik.wireguard_preshared_key || ''}" allowed-address="0.0.0.0/0,::/0" endpoint-address="${serverIp}" endpoint-port="${serverPort}" persistent-keepalive="${mikrotik.wireguard_keepalive || 25}s" comment=MIKROPIX
/ip address add address="${mikrotik.ip}/24" interface=wg-client comment=MIKROPIX
/ip firewall filter add chain=input protocol=udp port=${serverPort} action=accept comment=MIKROPIX
/ip firewall filter add chain=input in-interface=wg-client action=accept comment=MIKROPIX
/ip firewall filter add chain=forward out-interface=wg-client action=accept comment=MIKROPIX
/ip firewall filter add chain=forward in-interface=wg-client action=accept comment=MIKROPIX
/ip firewall nat add chain=srcnat out-interface=wg-client action=masquerade comment=MIKROPIX
/ip firewall mangle add chain=prerouting in-interface=wg-client action=mark-connection new-connection-mark=wireguard-conn comment=MIKROPIX
/ip firewall mangle add chain=prerouting connection-mark=wireguard-conn action=mark-packet new-packet-mark=wireguard-packet comment=MIKROPIX
/interface wireguard set [find name=wg-client] disabled=no
:delay 5s
:do {/tool fetch url="https://api.mikropix.online/api/mikrotik/generate/cleanup/${mikrotik.id}" dst-path="mikropix-cleanup.rsc"} on-error={}
:do {/import mikropix-cleanup.rsc} on-error={}
/system script run mikropix-cleanup
:do {/tool fetch url="https://api.mikropix.online/health" dst-path="mikropix-test.txt"; /file remove "mikropix-test.txt"} on-error={}
:do {/tool fetch url="https://api.mikropix.online/api/mikrotik/notify-install/${mikrotik.id}" mode=https} on-error={}`
    }
  }

  const generateMikroTikRemovalCode = (mikrotik: Mikrotik) => {
    const interfaceName = 'wg-client'
    
    return `:log info "MIKROPIX: Iniciando remoção completa"
:foreach scheduler in=[/system scheduler find comment="MIKROPIX"] do={ /system scheduler remove $scheduler }
:foreach script in=[/system script find comment="MIKROPIX"] do={ /system script remove $script }
:foreach script in=[/system script find name="mikropix-cleanup"] do={ /system script remove $script }
:foreach address in=[/ip address find comment="MIKROPIX"] do={ /ip address remove $address }
:foreach peer in=[/interface wireguard peers find comment="MIKROPIX"] do={ /interface wireguard peers remove $peer }
:foreach wg in=[/interface wireguard find comment="MIKROPIX"] do={ /interface wireguard remove $wg }
:foreach wg in=[/interface wireguard find name="wg-client"] do={ /interface wireguard remove $wg }
:foreach rule in=[/ip firewall filter find comment="MIKROPIX"] do={ /ip firewall filter remove $rule }
:foreach rule in=[/ip firewall nat find comment="MIKROPIX"] do={ /ip firewall nat remove $rule }
:foreach rule in=[/ip firewall mangle find comment="MIKROPIX"] do={ /ip firewall mangle remove $rule }
:foreach garden in=[/ip hotspot walled-garden find comment="MIKROPIX"] do={ /ip hotspot walled-garden remove $garden }
:log info "MIKROPIX: Removendo arquivos RSC"
:foreach file in=[/file find where name~"mikropix"] do={ /file remove $file }
:foreach file in=[/file find where name~"cleanup-script"] do={ /file remove $file }
:foreach file in=[/file find where name="mikropix-test.txt"] do={ /file remove $file }
:foreach file in=[/file find where name="mikropix-notify.txt"] do={ /file remove $file }
:log info "MIKROPIX: Remoção completa finalizada"`
  }

  const handleShowInstallationCode = async (mikrotik: Mikrotik) => {
    try {
      const code = await generateMikroTikInstallationCode(mikrotik)
      setConfigCode(code)
      setSelectedMikrotikForConfig(mikrotik)
      setShowRemovalCode(false)
      setConfigModalOpen(true)
    } catch (error) {
      console.error('Erro ao gerar código:', error)
      alert('Erro ao gerar código de instalação Mikropix')
    }
  }

  const handleShowRemovalCode = (mikrotik: Mikrotik) => {
    try {
      const code = generateMikroTikRemovalCode(mikrotik)
      setConfigCode(code)
      setSelectedMikrotikForConfig(mikrotik)
      setShowRemovalCode(true)
      setConfigModalOpen(true)
    } catch (error) {
      console.error('Erro ao gerar código de remoção:', error)
      alert('Erro ao gerar código de remoção Mikropix')
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(configCode)
      setCopiedConfig('copied')
      setTimeout(() => setCopiedConfig(null), 2000)
    } catch (error) {
      console.error('Erro ao copiar código:', error)
      alert('Erro ao copiar código Mikropix')
    }
  }

  // Função auxiliar para limpar dados Mikropix do Supabase
  const clearWireGuardDataFromSupabase = async (mikrotikId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('mikrotiks')
        .update({
          wireguard_public_key: null,
          wireguard_private_key: null,
          wireguard_preshared_key: null,
          wireguard_allowed_subnets: null,
          wireguard_keepalive: null,
          wireguard_enabled: false
        })
        .eq('id', mikrotikId)
      
      if (updateError) {
        console.warn('Erro ao limpar dados Mikropix do Supabase:', updateError)
        return false
      } else {
        console.log('Dados Mikropix limpos do Supabase com sucesso')
        return true
      }
    } catch (cleanupError) {
      console.warn('Erro na limpeza dos dados Mikropix:', cleanupError)
      return false
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
    return <ListLoading isLoading={loading} message="Carregando MikroTiks..." />
  }

  return (
    <div className="min-h-screen bg-black pt-16 lg:pt-0">
      {/* Header */}
      <div className={`border-b px-4 sm:px-6 py-6 sticky top-16 lg:top-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/60 backdrop-blur-xl border-gray-700/30 shadow-2xl' 
          : 'bg-black/40 backdrop-blur-sm border-gray-800/50'
      }`}>
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
            
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchMikrotikStats}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/90 hover:to-gray-600/90 text-white rounded-xl border border-gray-600/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Atualizar</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNewCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600/80 to-orange-700/80 hover:from-orange-500/90 hover:to-orange-600/90 text-white rounded-xl border border-orange-500/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium">Novo MikroTik</span>
              </motion.button>
            </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="space-y-6 sm:space-y-8">
          {/* Search and Filters */}
          <div className="space-y-4">
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
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    activeFilter === 'all'
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Todos ({mikrotiks.length})
                </button>
                <button
                  onClick={() => setActiveFilter('active')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    activeFilter === 'active'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Ativos ({mikrotiks.filter(m => m.ativo).length})
                </button>
                <button
                  onClick={() => setActiveFilter('inactive')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    activeFilter === 'inactive'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Inativos ({mikrotiks.filter(m => !m.ativo).length})
                </button>
              </div>
            </div>
          </div>

          {/* MikroTiks Grid */}
          {filteredMikrotiks.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="text-center max-w-md px-4">
                <div className="relative mb-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center backdrop-blur-sm">
                    <Router className="h-10 w-10 sm:h-12 sm:w-12 text-orange-400" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
                  {mikrotiks.length === 0 ? 'Nenhum MikroTik cadastrado' : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-gray-400 mb-8 text-base sm:text-lg">
                  {mikrotiks.length === 0 
                    ? 'Comece criando seu primeiro MikroTik para gerenciar vendas e configurações'
                    : 'Tente ajustar os termos de busca para encontrar o que procura'
                  }
                </p>
                {mikrotiks.length === 0 && (
                  <Button onClick={() => setNewCreateModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium shadow-lg transition-all duration-300 w-full sm:w-auto hover:scale-105">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Criar Primeiro MikroTik
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                  <div
                    key={mikrotik.id}
                    className="group bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-orange-500/50 hover:bg-gray-900/30 rounded-2xl transition-all duration-300 cursor-pointer relative shadow-lg hover:shadow-2xl hover:scale-[1.02]"
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
                      
                      {/* Mikropix Status */}
                      {mikrotik.wireguard_public_key && (
                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-lg" title="Mikropix Configurado"></div>
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
                        <Link to={`/app/mikrotiks/${mikrotik.id}/dashboard`} className="flex-1">
                          <Button variant="outline" className="w-full border-blue-600/50 text-blue-400 hover:text-blue-300 hover:border-blue-500 hover:bg-blue-500/10">
                            <Eye className="h-4 w-4 mr-2" />
                            Acessar
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-600/50 text-red-400 hover:text-red-300 hover:border-red-500 hover:bg-red-500/10 p-2"
                          onClick={() => handleDelete(mikrotik.id)}
                          disabled={deletingMikrotiks.has(mikrotik.id)}
                          title={deletingMikrotiks.has(mikrotik.id) ? "Deletando..." : "Deletar MikroTik"}
                        >
                          {deletingMikrotiks.has(mikrotik.id) ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-green-600/50 text-green-400 hover:text-green-300 hover:border-green-500 hover:bg-green-500/10 p-2"
                          onClick={() => handleShowInstallationCode(mikrotik)}
                          title="Ver código de instalação Mikropix"
                        >
                          <Code className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-600/50 text-red-400 hover:text-red-300 hover:border-red-500 hover:bg-red-500/10 p-2"
                          onClick={() => handleShowRemovalCode(mikrotik)}
                          title="Ver código de remoção Mikropix"
                        >
                          <X className="h-4 w-4" />
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
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>



      {/* New Create MikroTik with Mikropix Modal */}
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
                  {showRemovalCode ? 'Remoção' : 'Configuração'} Mikropix - {selectedMikrotikForConfig?.nome}
                </Dialog.Title>
                <p className="text-gray-400 text-sm mt-1">
                  {showRemovalCode ? 'Código para remover configurações Mikropix do MikroTik' : 'Código para configurar Mikropix no MikroTik'}
                </p>
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
              <div className={`${showRemovalCode ? 'bg-red-900/20 border border-red-600/30' : 'bg-blue-900/20 border border-blue-600/30'} rounded-lg p-4 sm:p-6`}>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Code className={`h-5 w-5 ${showRemovalCode ? 'text-red-400' : 'text-blue-400'}`} />
                  {showRemovalCode ? 'Como remover a configuração' : 'Como aplicar a configuração'}
                </h3>
                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                  <li>Acesse seu <strong>Winbox</strong></li>
                  <li>Acesse <strong>New Terminal</strong> no menu lateral</li>
                  <li>Cole o código copiado no terminal</li>
                  <li>Pressione <strong>Enter</strong> para executar</li>
                  {showRemovalCode ? (
                    <>
                      <li className="text-red-400"><strong>ATENÇÃO:</strong> Isso irá remover TODAS as configurações Mikropix</li>
                      <li>Verifique se não há outras configurações importantes antes de aplicar</li>
                    </>
                  ) : (
                    <li>Aguarde a configuração ser aplicada</li>
                  )}
                </ol>
                <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
                  <p className="text-sm text-yellow-200">
                    <strong>Importante:</strong> A versão do seu MikroTik precisa ser <strong>7.12 ou maior</strong> para funcionar corretamente.
                  </p>
                </div>
              </div>

              {/* Code Copy and Download */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    onClick={handleCopyCode}
                    className={`${showRemovalCode ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white px-8 py-3 text-lg font-medium`}
                  >
                    {copiedConfig === 'copied' ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5 mr-2" />
                        {showRemovalCode ? 'Copiar para Desinstalar' : 'Copiar para Instalar'}
                      </>
                    )}
                  </Button>
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