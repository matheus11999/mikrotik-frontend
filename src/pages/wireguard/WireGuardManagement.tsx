import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useToast } from '../../components/ui/toast'
import { 
  Shield, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Router, 
  Globe, 
  Clock, 
  Wifi,
  RefreshCw,
  Plus,
  X,
  Save,
  AlertCircle,
  QrCode,
  Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'

interface WireGuardPeer {
  id: string
  publicKey: string
  presharedKey?: string
  allowedSubnets: string[]
  persistentKeepalive: number
  enabled: boolean
  isConnected: boolean
  lastHandshake?: string
  latestHandshake: number
  transferRx?: number
  transferTx?: number
  endpoint?: string
}

interface WireGuardStats {
  timestamp: number
  peers: number
  totalV4Ips: number
  freeV4Ips: number
  transferTx: number
  transferRx: number
}

interface MikroTik {
  id: string
  nome: string
  ip?: string
  wireguard_public_key?: string
  wireguard_private_key?: string
  wireguard_preshared_key?: string
  wireguard_allowed_subnets?: string
  wireguard_keepalive?: number
  users?: {
    nome: string
    email: string
  }
}

export function WireGuardManagement() {
  const { user, session } = useAuthContext()
  const { addToast } = useToast()
  
  const [peers, setPeers] = useState<WireGuardPeer[]>([])
  const [mikrotiks, setMikrotiks] = useState<MikroTik[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeer, setSelectedPeer] = useState<WireGuardPeer | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false)
  const [serverInfo, setServerInfo] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected' | 'enabled' | 'disabled'>('all')
  const [serverStats, setServerStats] = useState<WireGuardStats | null>(null)

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://api.mikropix.online'

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchWireGuardPeers(),
        fetchMikroTiks(),
        fetchServerInfo(),
        fetchServerStats()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao carregar dados do WireGuard'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchWireGuardPeers = async () => {
    try {
      const token = session?.access_token || localStorage.getItem('token')
      console.log('Fetching peers from:', `${BACKEND_URL}/api/mikrotik/wirerest/peers`)
      
      const response = await fetch(`${BACKEND_URL}/api/mikrotik/wirerest/peers`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Received data:', data)
        
        // Handle the response structure from backend
        if (data.success && data.peers) {
          setPeers(data.peers)
          console.log('Set peers:', data.peers)
        } else if (Array.isArray(data)) {
          setPeers(data)
        } else {
          console.warn('Unexpected data structure:', data)
          setPeers([])
        }
      } else {
        const errorData = await response.text()
        console.error('Error response:', errorData)
        addToast({
          type: 'error',
          title: 'Erro!',
          description: `Erro ao buscar conexões: ${response.status}`
        })
      }
    } catch (error) {
      console.error('Error fetching WireGuard peers:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro de conexão ao buscar conexões WireGuard'
      })
    }
  }

  const fetchMikroTiks = async () => {
    try {
      const { data, error } = await supabase
        .from('mikrotiks')
        .select(`
          *,
          users (
            nome,
            email
          )
        `)
        .not('wireguard_public_key', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMikrotiks(data || [])
    } catch (error) {
      console.error('Error fetching MikroTiks:', error)
    }
  }

  const fetchServerInfo = async () => {
    try {
      const token = session?.access_token || localStorage.getItem('token')
      const response = await fetch(`${BACKEND_URL}/api/mikrotik/wirerest/interface`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setServerInfo(data)
      }
    } catch (error) {
      console.error('Error fetching server info:', error)
    }
  }

  const fetchServerStats = async () => {
    try {
      const token = session?.access_token || localStorage.getItem('token')
      const response = await fetch(`${BACKEND_URL}/api/mikrotik/wirerest/stats`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setServerStats(data)
        console.log('Server stats fetched:', data)
      } else {
        console.warn('Failed to fetch server stats:', response.status)
      }
    } catch (error) {
      console.error('Error fetching server stats:', error)
    }
  }

  const handleDeletePeer = async () => {
    if (!selectedPeer) return

    try {
      const token = session?.access_token || localStorage.getItem('token')
      console.log('Deletando conexão:', selectedPeer.publicKey)
      
      // Use path parameter as defined in backend route
      const encodedPublicKey = encodeURIComponent(selectedPeer.publicKey)
      const response = await fetch(`${BACKEND_URL}/api/mikrotik/wirerest/peers/${encodedPublicKey}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      })

      const data = await response.json()
      console.log('Delete response:', data)

      if (response.ok && data.success) {
        // Remove peer from local state
        setPeers(prev => prev.filter(p => p.publicKey !== selectedPeer.publicKey))
        
        // Remove WireGuard data from associated MikroTik
        const associatedMikroTik = mikrotiks.find(m => m.wireguard_public_key === selectedPeer.publicKey)
        if (associatedMikroTik) {
          const { error } = await supabase
            .from('mikrotiks')
            .update({
              wireguard_public_key: null,
              wireguard_private_key: null,
              wireguard_preshared_key: null,
              wireguard_allowed_subnets: null,
              wireguard_keepalive: null,
              wireguard_enabled: false
            })
            .eq('id', associatedMikroTik.id)
          
          if (error) {
            console.warn('Erro ao limpar dados WireGuard do MikroTik:', error)
          }
        }

        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: data.message || 'Conexão WireGuard removida com sucesso'
        })
        
        setDeleteModalOpen(false)
        setSelectedPeer(null)
        fetchData() // Refresh data
      } else {
        throw new Error(data.error || 'Falha ao deletar conexão')
      }
    } catch (error) {
      console.error('Error deleting peer:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: error instanceof Error ? error.message : 'Erro ao remover conexão WireGuard'
      })
    }
  }

  const getMikroTikForPeer = (peer: WireGuardPeer) => {
    return mikrotiks.find(m => m.wireguard_public_key === peer.publicKey)
  }

  const isPeerConnected = (peer: WireGuardPeer) => {
    if (!peer.latestHandshake || peer.latestHandshake === 0) return false
    // Consider connected if handshake within last 5 minutes (300 seconds)
    const now = Math.floor(Date.now() / 1000)
    return (now - peer.latestHandshake) < 300
  }

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatLastHandshake = (peer: WireGuardPeer) => {
    if (!peer.latestHandshake || peer.latestHandshake === 0) return 'Nunca'
    
    const handshakeTime = new Date(peer.latestHandshake * 1000) // Convert from Unix timestamp
    const now = new Date()
    const diffMs = now.getTime() - handshakeTime.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    
    if (diffMinutes < 1) return 'Agora'
    if (diffMinutes < 60) return `${diffMinutes}m atrás`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`
    return `${Math.floor(diffMinutes / 1440)}d atrás`
  }

  const generateClientConfig = (peer: WireGuardPeer) => {
    const mikrotik = getMikroTikForPeer(peer)
    if (!mikrotik || !serverInfo) return null

    const clientIP = mikrotik.wireguard_allowed_subnets?.split(',')[0] || '10.8.0.0/32'
    
    return `[Interface]
PrivateKey = ${mikrotik.wireguard_private_key}
Address = ${clientIP}
DNS = 1.1.1.1

[Peer]
PublicKey = ${serverInfo.publicKey}
PresharedKey = ${mikrotik.wireguard_preshared_key || ''}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = 193.181.208.141:64326
PersistentKeepalive = 25`
  }

  const filteredPeers = peers.filter(peer => {
    const mikrotik = getMikroTikForPeer(peer)
    const searchLower = searchTerm.toLowerCase()
    
    // Filter by search term
    const matchesSearch = !searchTerm || (
      peer.publicKey.toLowerCase().includes(searchLower) ||
      mikrotik?.nome.toLowerCase().includes(searchLower) ||
      mikrotik?.users?.nome.toLowerCase().includes(searchLower) ||
      mikrotik?.users?.email.toLowerCase().includes(searchLower) ||
      peer.allowedSubnets.some(subnet => subnet.toLowerCase().includes(searchLower))
    )
    
    // Filter by connection status
    let matchesStatus = true
    switch (statusFilter) {
      case 'all':
        matchesStatus = true
        break
      case 'connected':
        matchesStatus = isPeerConnected(peer)
        break
      case 'disconnected':
        matchesStatus = !isPeerConnected(peer)
        break
      case 'enabled':
        matchesStatus = peer.enabled === true
        break
      case 'disabled':
        matchesStatus = peer.enabled === false
        break
      default:
        matchesStatus = true
    }
    
    return matchesSearch && matchesStatus
  })


  // Get connection status stats - safe calculation
  const connectedPeers = peers.filter(p => isPeerConnected(p)).length || 0
  const disconnectedPeers = peers.filter(p => !isPeerConnected(p)).length || 0
  const enabledPeers = peers.filter(p => p.enabled === true).length || 0
  const disabledPeers = peers.filter(p => p.enabled === false).length || 0

  if (loading) {
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
            className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full mx-auto mb-6"
          />
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2"
          >
            Carregando WireGuard...
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400"
          >
            Aguarde um momento
          </motion.p>
        </motion.div>
      </div>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black pt-16 lg:pt-0 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 flex items-center justify-center backdrop-blur-sm"
          >
            <AlertCircle className="h-12 w-12 text-red-400" />
          </motion.div>
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4"
          >
            Acesso Negado
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 text-lg"
          >
            Apenas administradores podem acessar esta página.
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-black pt-16 lg:pt-0">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm sticky top-16 lg:top-0 z-10"
      >
        <div className="px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20"
              >
                <Shield className="h-6 w-6 text-purple-400" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                >
                  Gerenciamento WireGuard
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-400"
                >
                  Gerencie conexões e configurações VPN
                </motion.p>
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={fetchData}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
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

          {/* Server Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20"
                >
                  <Globe className="w-6 w-6 text-green-400" />
                </motion.div>
                <div>
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg font-semibold text-white"
                  >
                    Servidor WireGuard
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-gray-400"
                  >
                    193.181.208.141:64326
                  </motion.p>
                </div>
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center space-x-2"
              >
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Online
                </span>
              </motion.div>
            </div>
            
            {/* Server Stats */}
            {serverStats && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-400 mb-1">Peers Ativos</p>
                      <p className="text-xl font-bold text-white">{serverStats.peers}</p>
                    </div>
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-400 mb-1">IPs Livres</p>
                      <p className="text-xl font-bold text-white">{serverStats.freeV4Ips}</p>
                      <p className="text-xs text-gray-500">de {serverStats.totalV4Ips}</p>
                    </div>
                    <Wifi className="w-5 h-5 text-green-400" />
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-400 mb-1">Download</p>
                      <p className="text-lg font-bold text-green-400">{formatBytes(serverStats.transferRx)}</p>
                    </div>
                    <div className="text-green-400 text-xl">↓</div>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-400 mb-1">Upload</p>
                      <p className="text-lg font-bold text-blue-400">{formatBytes(serverStats.transferTx)}</p>
                    </div>
                    <div className="text-blue-400 text-xl">↑</div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* Search and Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por conexão, MikroTik, usuário ou IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-black/40 backdrop-blur-sm border-gray-800/50 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
              />
            </div>
            
            {/* Status Filters */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2"
            >
              {[
                { key: 'all', label: `Todas (${peers.length})`, color: 'blue' },
                { key: 'connected', label: `Online (${connectedPeers})`, color: 'green', icon: true },
                { key: 'disconnected', label: `Offline (${disconnectedPeers})`, color: 'red', icon: true },
                { key: 'enabled', label: `Ativadas (${enabledPeers})`, color: 'emerald', icon: true },
                { key: 'disabled', label: `Desativadas (${disabledPeers})`, color: 'gray', icon: true }
              ].map((filter, index) => (
                <motion.div
                  key={filter.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setStatusFilter(filter.key as any)}
                    variant={statusFilter === filter.key ? 'default' : 'outline'}
                    size="sm"
                    className={`h-9 text-xs transition-all duration-200 ${
                      statusFilter === filter.key
                        ? `bg-${filter.color}-600 hover:bg-${filter.color}-700 text-white shadow-lg`
                        : 'border-gray-700 text-gray-300 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10'
                    }`}
                  >
                    {filter.icon && (
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        filter.color === 'green' ? 'bg-green-400' :
                        filter.color === 'red' ? 'bg-red-400' :
                        filter.color === 'emerald' ? 'bg-emerald-400' :
                        'bg-gray-400'
                      }`}></div>
                    )}
                    {filter.label}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Connections List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-800/50">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="text-lg font-semibold text-white flex items-center"
              >
                <Users className="w-5 h-5 mr-2 text-purple-400" />
                Conexões WireGuard ({filteredPeers.length})
              </motion.h2>
            </div>

            {filteredPeers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex justify-center py-16"
              >
                <div className="text-center max-w-md">
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center backdrop-blur-sm"
                  >
                    <Shield className="h-12 w-12 text-purple-400" />
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4"
                  >
                    Nenhuma conexão encontrada
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="text-gray-400 text-lg"
                  >
                    Tente ajustar os filtros de busca
                  </motion.p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="overflow-x-auto"
              >
                <table className="w-full">
                  <thead className="bg-black/40">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        MikroTik
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        IP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Tráfego
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {filteredPeers.map((peer, index) => {
                      const mikrotik = getMikroTikForPeer(peer)
                      const allowedIPs = peer.allowedSubnets.join(', ')
                      
                      return (
                        <motion.tr 
                          key={peer.publicKey} 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          whileHover={{ scale: 1.01, backgroundColor: 'rgba(75, 85, 99, 0.1)' }}
                          className="hover:bg-gray-800/30 transition-all duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {mikrotik ? (
                              <div className="flex items-center">
                                <Router className="w-4 h-4 text-blue-400 mr-3" />
                                <div>
                                  <p className="text-sm font-medium text-white">{mikrotik.nome}</p>
                                  <p className="text-xs text-gray-400">{mikrotik.ip}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">Não vinculado</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {mikrotik?.users ? (
                              <div>
                                <p className="text-sm font-medium text-white">{mikrotik.users.nome}</p>
                                <p className="text-xs text-gray-400">{mikrotik.users.email}</p>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-white font-mono bg-gray-800/50 px-2 py-1 rounded">{allowedIPs}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isPeerConnected(peer) 
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                <Wifi className={`w-3 h-3 mr-1 ${
                                  isPeerConnected(peer) ? 'text-blue-400' : 'text-red-400'
                                }`} />
                                {isPeerConnected(peer) ? 'Online' : 'Offline'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                peer.enabled 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                              }`}>
                                <Shield className={`w-3 h-3 mr-1 ${
                                  peer.enabled ? 'text-green-400' : 'text-gray-400'
                                }`} />
                                {peer.enabled ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm space-y-1">
                              <div className="flex items-center text-green-400">
                                <span className="mr-2 font-bold">↓</span>
                                <span>{formatBytes(peer.transferRx || 0)}</span>
                              </div>
                              <div className="flex items-center text-blue-400">
                                <span className="mr-2 font-bold">↑</span>
                                <span>{formatBytes(peer.transferTx || 0)}</span>
                              </div>
                              {peer.latestHandshake && peer.latestHandshake > 0 && (
                                <div className="flex items-center text-gray-400">
                                  <Clock className="w-3 h-3 mr-2" />
                                  <span className="text-xs">{formatLastHandshake(peer)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPeer(peer)
                                    setEditModalOpen(true)
                                  }}
                                  className="border-gray-600 text-gray-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 h-8 w-8 p-0 transition-all duration-200"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPeer(peer)
                                    setQrCodeModalOpen(true)
                                  }}
                                  className="border-purple-600 text-purple-400 hover:text-purple-300 hover:border-purple-500 hover:bg-purple-500/10 h-8 w-8 p-0 transition-all duration-200"
                                  disabled={!getMikroTikForPeer(peer)}
                                >
                                  <QrCode className="w-4 h-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPeer(peer)
                                    setDeleteModalOpen(true)
                                  }}
                                  className="border-red-600 text-red-400 hover:text-red-300 hover:border-red-500 hover:bg-red-500/10 h-8 w-8 p-0 transition-all duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </motion.div>
            )}
          </motion.div>

        </motion.div>
      </div>

        {/* View/Edit Modal */}
        <Dialog.Root open={editModalOpen} onOpenChange={setEditModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50 p-6"
              aria-describedby="dialog-description"
            >
              {selectedPeer && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-xl font-semibold text-white flex items-center">
                      <Shield className="w-6 h-6 text-blue-400 mr-2" />
                      Detalhes da Conexão
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-gray-800 text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </Button>
                    </Dialog.Close>
                  </div>
                  <Dialog.Description id="dialog-description" className="sr-only">
                    Visualizar detalhes da conexão WireGuard
                  </Dialog.Description>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Chave Pública</label>
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                          <p className="text-white font-mono text-sm break-all">{selectedPeer.publicKey}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">IPs Permitidos</label>
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                          <p className="text-white font-mono text-sm">{selectedPeer.allowedSubnets.join(', ')}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                          <div className="flex flex-col space-y-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isPeerConnected(selectedPeer) 
                                ? 'bg-blue-900/20 text-blue-400 border border-blue-600/30' 
                                : 'bg-red-900/20 text-red-400 border border-red-600/30'
                            }`}>
                              <Wifi className={`w-3 h-3 mr-2 ${
                                isPeerConnected(selectedPeer) ? 'text-blue-400' : 'text-red-400'
                              }`} />
                              {isPeerConnected(selectedPeer) ? 'Online' : 'Offline'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              selectedPeer.enabled 
                                ? 'bg-green-900/20 text-green-400 border border-green-600/30' 
                                : 'bg-gray-900/20 text-gray-400 border border-gray-600/30'
                            }`}>
                              <Shield className={`w-3 h-3 mr-2 ${
                                selectedPeer.enabled ? 'text-green-400' : 'text-gray-400'
                              }`} />
                              {selectedPeer.enabled ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Último Handshake</label>
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                          <p className="text-white">{formatLastHandshake(selectedPeer)}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Keepalive</label>
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                          <p className="text-white">{selectedPeer.persistentKeepalive}s</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Dados Transferidos</label>
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                          <p className="text-white text-sm">
                            <span className="text-green-400">↓ {formatBytes(selectedPeer.transferRx || 0)}</span>
                            <span className="mx-2 text-gray-500">•</span>
                            <span className="text-blue-400">↑ {formatBytes(selectedPeer.transferTx || 0)}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const mikrotik = getMikroTikForPeer(selectedPeer)
                      return mikrotik ? (
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Router className="w-5 h-5 text-blue-400 mr-2" />
                            MikroTik Vinculado
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                              <p className="text-white">{mikrotik.nome}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">IP</label>
                              <p className="text-white">{mikrotik.ip || 'N/A'}</p>
                            </div>
                            {mikrotik.users && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-1">Usuário</label>
                                  <p className="text-white">{mikrotik.users.nome}</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                  <p className="text-white">{mikrotik.users.email}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                            <p className="text-yellow-400">Esta conexão não está vinculada a nenhum MikroTik</p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Delete Modal */}
        <Dialog.Root open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border border-gray-800 rounded-xl shadow-2xl w-full max-w-md z-50 p-6"
              aria-describedby="delete-dialog-description"
            >
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-white flex items-center">
                  <Trash2 className="w-6 h-6 text-red-400 mr-2" />
                  Confirmar Exclusão
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-800 text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </Dialog.Close>
              </div>
              <Dialog.Description id="delete-dialog-description" className="sr-only">
                Confirmar a exclusão da conexão WireGuard
              </Dialog.Description>

              <div className="space-y-4">
                <p className="text-gray-300">
                  Tem certeza de que deseja remover esta conexão WireGuard? Esta ação não pode ser desfeita.
                </p>
                
                {selectedPeer && (
                  <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                    <p className="text-red-400 text-sm font-mono break-all">
                      {selectedPeer.publicKey}
                    </p>
                    {(() => {
                      const mikrotik = getMikroTikForPeer(selectedPeer)
                      return mikrotik && (
                        <p className="text-red-300 text-sm mt-2">
                          Vinculado ao MikroTik: {mikrotik.nome}
                        </p>
                      )
                    })()}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Dialog.Close asChild>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                    >
                      Cancelar
                    </Button>
                  </Dialog.Close>
                  <Button
                    onClick={handleDeletePeer}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* QR Code Modal */}
        <Dialog.Root open={qrCodeModalOpen} onOpenChange={setQrCodeModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg z-50 p-6"
              aria-describedby="qr-dialog-description"
            >
              {selectedPeer && (() => {
                const mikrotik = getMikroTikForPeer(selectedPeer)
                const clientConfig = generateClientConfig(selectedPeer)
                
                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title className="text-xl font-semibold text-white flex items-center">
                        <QrCode className="w-6 h-6 text-purple-400 mr-2" />
                        QR Code de Conexão
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-gray-800 text-gray-400 hover:text-white">
                          <X className="w-5 h-5" />
                        </Button>
                      </Dialog.Close>
                    </div>
                    <Dialog.Description id="qr-dialog-description" className="sr-only">
                      QR Code para configuração WireGuard
                    </Dialog.Description>

                    <div className="space-y-6 text-center">
                      {mikrotik && clientConfig ? (
                        <>
                          <div>
                            <h3 className="text-lg font-medium text-white mb-2">{mikrotik.nome}</h3>
                            <p className="text-sm text-gray-400">
                              Cliente: {mikrotik.users?.nome || 'N/A'} • IP: {mikrotik.wireguard_allowed_subnets?.split(',')[0] || 'N/A'}
                            </p>
                          </div>

                          <div className="bg-white p-6 rounded-lg inline-block">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(clientConfig)}`}
                              alt="QR Code WireGuard"
                              className="w-72 h-72"
                            />
                          </div>

                          <div className="space-y-3">
                            <p className="text-sm text-gray-300">
                              📱 Escaneie este QR Code com o app WireGuard no seu celular
                            </p>
                            
                            <div className="flex justify-center space-x-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (clientConfig) {
                                    navigator.clipboard.writeText(clientConfig)
                                    addToast({
                                      type: 'success',
                                      title: 'Copiado!',
                                      description: 'Configuração copiada para área de transferência'
                                    })
                                  }
                                }}
                                className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                              >
                                📋 Copiar Config
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (clientConfig && mikrotik) {
                                    const blob = new Blob([clientConfig], { type: 'text/plain' })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `${mikrotik.nome}-wireguard.conf`
                                    document.body.appendChild(a)
                                    a.click()
                                    document.body.removeChild(a)
                                    URL.revokeObjectURL(url)
                                    
                                    addToast({
                                      type: 'success',
                                      title: 'Download!',
                                      description: 'Arquivo de configuração baixado'
                                    })
                                  }
                                }}
                                className="border-blue-600 text-blue-400 hover:text-blue-300 hover:border-blue-500"
                              >
                                💾 Download .conf
                              </Button>
                            </div>
                          </div>

                          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-left">
                            <p className="text-xs text-gray-400 mb-2">📋 Configuração WireGuard:</p>
                            <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                              {clientConfig}
                            </pre>
                          </div>
                        </>
                      ) : (
                        <div className="py-8">
                          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-white mb-2">Configuração Indisponível</h3>
                          <p className="text-gray-400">
                            Esta conexão não possui dados completos do WireGuard ou não está vinculada a um MikroTik.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  )
}

export default WireGuardManagement