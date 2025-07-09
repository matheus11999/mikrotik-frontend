import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useToast } from '../../components/ui/toast'
import { 
  Laptop, 
  Shield, 
  QrCode, 
  Download, 
  Trash2, 
  RefreshCw, 
  Router, 
  Smartphone,
  Monitor,
  Wifi,
  ExternalLink,
  AlertCircle,
  X,
  Copy,
  Check,
  Network,
  Users,
  Globe,
  Clock,
  User,
  UserCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'

interface WireGuardPeer {
  id: string
  publicKey: string
  privateKey?: string
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

interface MikroTik {
  id: string
  nome: string
  ip?: string
  port?: number
  username?: string
  password?: string
  users?: {
    nome: string
    email: string
  }
}

export function WinboxManagement() {
  const { user, session } = useAuthContext()
  const { addToast } = useToast()
  
  const [userPeer, setUserPeer] = useState<WireGuardPeer | null>(null)
  const [userMikrotiks, setUserMikrotiks] = useState<MikroTik[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [serverInfo, setServerInfo] = useState<any>(null)
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios' | 'windows'>('android')

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://api.mikropix.online'

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchUserPeer(),
        fetchUserMikrotiks(),
        fetchServerInfo()
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

  const fetchUserPeer = async () => {
    try {
      // Obter token atual do Supabase
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const token = currentSession?.access_token || session?.access_token || localStorage.getItem('token')
      
      if (!token) {
        console.error('Token de autenticação não encontrado')
        return
      }
      
      // Primeiro, vamos buscar o peer do usuário através do banco de dados
      const { data: userWithPeer, error: userError } = await supabase
        .from('users')
        .select('winbox_peer_public_key, winbox_peer_private_key, winbox_peer_preshared_key')
        .eq('id', user?.id)
        .single()
      
      if (userError) {
        console.error('Error fetching user peer from database:', userError)
        return
      }
      
      // Se não tem peer registrado, não há peer
      if (!userWithPeer?.winbox_peer_public_key) {
        setUserPeer(null)
        return
      }
      
      // Buscar todos os peers do servidor
      const response = await fetch(`${BACKEND_URL}/api/mikrotik/wirerest/peers`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const peers = data.success ? data.peers : (Array.isArray(data) ? data : [])
        
        // Encontrar o peer do usuário
        const userPeerFromServer = peers.find((peer: WireGuardPeer) => 
          peer.publicKey === userWithPeer.winbox_peer_public_key
        )
        
        if (userPeerFromServer) {
          console.log('🔍 [DEBUG] User peer from server:', {
            publicKey: userPeerFromServer.publicKey ? '[PRESENT]' : '[MISSING]',
            privateKey: userPeerFromServer.privateKey ? '[PRESENT]' : '[MISSING]',
            presharedKey: userPeerFromServer.presharedKey ? '[PRESENT]' : '[MISSING]',
            allowedSubnets: userPeerFromServer.allowedSubnets
          })
          
          // Adicionar chaves privada e preshared do banco de dados
          const enrichedPeer = {
            ...userPeerFromServer,
            privateKey: userWithPeer.winbox_peer_private_key || userPeerFromServer.privateKey,
            presharedKey: userWithPeer.winbox_peer_preshared_key || userPeerFromServer.presharedKey
          }
          
          console.log('🔍 [DEBUG] Enriched peer:', {
            publicKey: enrichedPeer.publicKey ? '[PRESENT]' : '[MISSING]',
            privateKey: enrichedPeer.privateKey ? '[PRESENT]' : '[MISSING]',
            presharedKey: enrichedPeer.presharedKey ? '[PRESENT]' : '[MISSING]',
            allowedSubnets: enrichedPeer.allowedSubnets
          })
          
          setUserPeer(enrichedPeer)
        } else {
          // Peer não encontrado no servidor, limpar do banco
          await supabase
            .from('users')
            .update({ 
              winbox_peer_public_key: null,
              winbox_peer_private_key: null,
              winbox_peer_preshared_key: null
            })
            .eq('id', user?.id)
          setUserPeer(null)
        }
      } else {
        console.error('Error fetching peers:', response.status)
        setUserPeer(null)
      }
    } catch (error) {
      console.error('Error fetching user peer:', error)
      setUserPeer(null)
    }
  }

  const fetchUserMikrotiks = async () => {
    try {
      const { data, error } = await supabase
        .from('mikrotiks')
        .select(`
          id,
          nome,
          ip,
          port,
          username,
          password,
          users (
            nome,
            email
          )
        `)
        .eq('user_id', user?.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserMikrotiks(data || [])
    } catch (error) {
      console.error('Error fetching user mikrotiks:', error)
      setUserMikrotiks([])
    }
  }

  const fetchServerInfo = async () => {
    try {
      // Obter token atual do Supabase
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const token = currentSession?.access_token || session?.access_token || localStorage.getItem('token')
      
      if (!token) {
        console.error('Token de autenticação não encontrado')
        return
      }
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

  const createPeer = async () => {
    try {
      setCreating(true)
      
      // Verificar se usuário está logado
      if (!user) {
        throw new Error('Usuário não autenticado')
      }
      
      // Obter token atual do Supabase
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const token = currentSession?.access_token || session?.access_token || localStorage.getItem('token')
      
      console.log('🔍 [DEBUG] Auth check:', {
        currentSessionToken: !!currentSession?.access_token,
        sessionToken: !!session?.access_token,
        localToken: !!localStorage.getItem('token'),
        hasToken: !!token,
        sessionUser: !!session?.user,
        user: !!user,
        userId: user?.id
      })
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado')
      }
      
      console.log('🔍 [DEBUG] Making request to:', `${BACKEND_URL}/api/mikrotik/wirerest/peers`)
      console.log('🔍 [DEBUG] Request headers:', {
        'accept': 'application/json',
        'Authorization': `Bearer ${token?.substring(0, 10)}...`
      })
      
      const response = await fetch(`${BACKEND_URL}/api/mikrotik/wirerest/peers`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('🔍 [DEBUG] Response status:', response.status)
      console.log('🔍 [DEBUG] Response headers:', Object.fromEntries(response.headers))
      
      const data = await response.json()
      console.log('🔍 [DEBUG] Response data:', data)

      if (response.ok) {
        // Verificar se a resposta tem a estrutura esperada
        let peerData = null
        
        if (data.success && data.peer) {
          // Estrutura com success/peer
          peerData = data.peer
          console.log('✅ [DEBUG] Using success/peer structure')
        } else if (data.publicKey) {
          // Estrutura direta do peer
          peerData = data
          console.log('✅ [DEBUG] Using direct peer structure')
        } else {
          console.error('❌ [DEBUG] Unexpected response structure:', data)
          throw new Error('Resposta da API em formato inesperado')
        }
        
        console.log('🔍 [DEBUG] Peer data keys:', Object.keys(peerData))
        console.log('🔍 [DEBUG] Peer data:', {
          publicKey: peerData.publicKey ? '[PRESENT]' : '[MISSING]',
          privateKey: peerData.privateKey ? '[PRESENT]' : '[MISSING]',
          presharedKey: peerData.presharedKey ? '[PRESENT]' : '[MISSING]',
          allowedSubnets: peerData.allowedSubnets
        })
        
        // Salvar a chave pública E privada do peer no banco de dados
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            winbox_peer_public_key: peerData.publicKey,
            winbox_peer_private_key: peerData.privateKey,
            winbox_peer_preshared_key: peerData.presharedKey
          })
          .eq('id', user?.id)
        
        if (updateError) {
          console.error('Error updating user:', updateError)
          throw new Error('Erro ao salvar dados do peer')
        }
        
        setUserPeer(peerData)
        
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: 'Peer WireGuard criado com sucesso!'
        })
        
        // Atualizar dados
        await fetchData()
      } else {
        console.error('❌ [DEBUG] API Error - Status:', response.status)
        console.error('❌ [DEBUG] API Error - Data:', data)
        
        // Tratamento específico para diferentes códigos de erro
        if (response.status === 401) {
          throw new Error('Token inválido ou expirado. Faça login novamente.')
        } else if (response.status === 403) {
          throw new Error('Acesso negado. Verifique suas permissões.')
        } else if (response.status === 500) {
          throw new Error('Erro interno do servidor. Tente novamente mais tarde.')
        } else {
          throw new Error(data.error || data.message || `Erro HTTP ${response.status}`)
        }
      }
    } catch (error) {
      console.error('Error creating peer:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: error instanceof Error ? error.message : 'Erro ao criar peer WireGuard'
      })
    } finally {
      setCreating(false)
    }
  }

  const deletePeer = async () => {
    if (!userPeer) return
    
    try {
      setDeleting(true)
      
      // Obter token atual do Supabase
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const token = currentSession?.access_token || session?.access_token || localStorage.getItem('token')
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado')
      }
      
      const encodedPublicKey = encodeURIComponent(userPeer.publicKey)
      const response = await fetch(`${BACKEND_URL}/api/mikrotik/wirerest/peers/${encodedPublicKey}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Remover do banco de dados
        await supabase
          .from('users')
          .update({ 
            winbox_peer_public_key: null,
            winbox_peer_private_key: null,
            winbox_peer_preshared_key: null
          })
          .eq('id', user?.id)
        
        setUserPeer(null)
        
        addToast({
          type: 'success',
          title: 'Sucesso!',
          description: 'Peer WireGuard removido com sucesso!'
        })
      } else {
        throw new Error(data.error || 'Erro ao deletar peer')
      }
    } catch (error) {
      console.error('Error deleting peer:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: error instanceof Error ? error.message : 'Erro ao remover peer WireGuard'
      })
    } finally {
      setDeleting(false)
    }
  }

  const generateClientConfig = () => {
    if (!userPeer || !serverInfo) {
      console.log('❌ [DEBUG] Cannot generate config - missing data:', { userPeer: !!userPeer, serverInfo: !!serverInfo })
      return null
    }

    const clientIP = userPeer.allowedSubnets?.[0] || '10.8.0.0/32'
    
    console.log('✅ [DEBUG] Generating config with:', {
      clientIP,
      serverPublicKey: serverInfo.publicKey,
      presharedKey: userPeer.presharedKey ? '[PRESENT]' : '[MISSING]',
      privateKey: userPeer.privateKey ? '[PRESENT]' : '[MISSING]'
    })
    
    return `[Interface]
PrivateKey = ${userPeer.privateKey || '[CHAVE_PRIVADA_NAO_DISPONIVEL]'}
Address = ${clientIP}
DNS = 1.1.1.1

[Peer]
PublicKey = ${serverInfo.publicKey}
PresharedKey = ${userPeer.presharedKey || ''}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = 193.181.208.141:64326
PersistentKeepalive = 25`
  }

  const handleCopyConfig = async () => {
    const config = generateClientConfig()
    if (!config) return
    
    try {
      await navigator.clipboard.writeText(config)
      setCopiedConfig('copied')
      setTimeout(() => setCopiedConfig(null), 2000)
      
      addToast({
        type: 'success',
        title: 'Copiado!',
        description: 'Configuração copiada para área de transferência'
      })
    } catch (error) {
      console.error('Error copying config:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao copiar configuração'
      })
    }
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
    
    const handshakeTime = new Date(peer.latestHandshake * 1000)
    const now = new Date()
    const diffMs = now.getTime() - handshakeTime.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    
    if (diffMinutes < 1) return 'Agora'
    if (diffMinutes < 60) return `${diffMinutes}m atrás`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`
    return `${Math.floor(diffMinutes / 1440)}d atrás`
  }

  const isPeerConnected = (peer: WireGuardPeer) => {
    if (!peer.latestHandshake || peer.latestHandshake === 0) return false
    const now = Math.floor(Date.now() / 1000)
    return (now - peer.latestHandshake) < 300 // 5 minutes
  }

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
            className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full mx-auto mb-6"
          />
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2"
          >
            Carregando Winbox...
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
                  className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20"
                >
                  <Laptop className="h-6 w-6 text-blue-400" />
                </motion.div>
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                  >
                    Winbox
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-400"
                  >
                    Conexão segura para acessar seus MikroTiks
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
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200"
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

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Peer Management */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center justify-center">
                    <Shield className="w-5 h-5 mr-2 text-purple-400" />
                    Sua Conexão WireGuard
                  </h2>
                </div>

                {userPeer ? (
                  <div className="space-y-6">
                    {/* User Avatar, Status and Actions */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-gray-800/50 flex items-center justify-center backdrop-blur-sm shadow-lg">
                          <UserCircle className="w-14 h-14 sm:w-16 sm:h-16 text-blue-400" />
                        </div>
                        {/* Status indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-black flex items-center justify-center shadow-lg ${
                          isPeerConnected(userPeer) ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                            isPeerConnected(userPeer) ? 'bg-green-300' : 'bg-red-300'
                          }`}></div>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="text-center space-y-3">
                        <h3 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          {user?.nome || 'Usuário'}
                        </h3>
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isPeerConnected(userPeer) ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          <span className={`text-sm sm:text-base font-medium ${
                            isPeerConnected(userPeer) ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {isPeerConnected(userPeer) ? 'Conectado' : 'Desconectado'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400">
                          Conexão segura para gerenciar seus MikroTiks
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                        <Button
                          onClick={() => setQrModalOpen(true)}
                          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1"
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Ver QR Code
                        </Button>
                        <Button
                          onClick={deletePeer}
                          disabled={deleting}
                          variant="outline"
                          className="border-red-600/50 text-red-400 hover:text-red-300 hover:border-red-500 hover:bg-red-500/10 flex-1"
                        >
                          {deleting ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Remover
                        </Button>
                      </div>
                    </div>

                    {/* Aviso de Segurança */}
                    <div className="p-4 sm:p-5 rounded-xl bg-orange-900/20 border border-orange-600/30">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-orange-500/20 border border-orange-500/30 flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-orange-400 mb-1">⚠️ Importante</h4>
                          <p className="text-sm text-orange-300 leading-relaxed">
                            Após gerenciar seus equipamentos, por favor <strong>desative a conexão</strong> no seu aplicativo WireGuard para manter a segurança da sua rede.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-gray-800/50 flex items-center justify-center">
                      <Shield className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Conexão WireGuard não configurada
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Configure uma conexão VPN segura para acessar seus MikroTiks remotamente através do Winbox
                    </p>
                    <Button
                      onClick={createPeer}
                      disabled={creating}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {creating ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4 mr-2" />
                      )}
                      Configurar Conexão
                    </Button>
                  </div>
                )}
              </motion.div>

              {/* User's MikroTiks */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center justify-center">
                    <Router className="w-5 h-5 mr-2 text-orange-400" />
                    Seus MikroTiks
                  </h2>
                </div>

              {userMikrotiks.length === 0 ? (
                <div className="text-center py-8">
                  <Router className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Nenhum MikroTik encontrado
                  </h3>
                  <p className="text-gray-400">
                    Adicione seus MikroTiks para acessá-los via WireGuard
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userMikrotiks.map((mikrotik, index) => (
                    <motion.div
                      key={mikrotik.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="p-4 rounded-xl bg-black/40 border border-gray-800/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30 flex-shrink-0">
                            <Router className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate mb-1">{mikrotik.nome}</h3>
                            {mikrotik.ip && (
                              <p className="text-xs text-blue-400 font-mono font-bold bg-blue-900/20 border border-blue-500/30 rounded px-2 py-1 inline-block">
                                {mikrotik.ip}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm flex-shrink-0" title="Ativo"></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-400">Usuário:</span>
                          <span className="text-white font-medium truncate px-2 py-1 bg-gray-800/50 rounded text-center">
                            {mikrotik.username || 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-400">Senha:</span>
                          <span className="text-white font-medium px-2 py-1 bg-gray-800/50 rounded text-center">
                            {mikrotik.password ? '••••••••' : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              </motion.div>
            </div>

            {/* Tutorial Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                    <Network className="h-6 w-6 text-blue-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Como Acessar Seus MikroTiks
                  </h2>
                </div>
              </div>

              {/* Platform Selection */}
              <div className="flex justify-center mb-8">
                <div className="flex flex-col sm:flex-row bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-1 gap-1 w-full max-w-md">
                  <button
                    onClick={() => setSelectedPlatform('android')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 flex-1 ${
                      selectedPlatform === 'android'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    Android
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('ios')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 flex-1 ${
                      selectedPlatform === 'ios'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    iOS
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('windows')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 flex-1 ${
                      selectedPlatform === 'windows'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    Windows
                  </button>
                </div>
              </div>

              {/* Platform-specific Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedPlatform}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {selectedPlatform === 'android' && (
                    <>
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 flex items-center justify-center">
                          <Smartphone className="h-10 w-10 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Android</h3>
                        <p className="text-gray-400 mb-6">
                          Baixe os aplicativos necessários para acessar seus MikroTiks
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                          <div className="p-4 sm:p-5 rounded-xl bg-green-900/20 border border-green-600/30">
                            <h4 className="text-lg font-semibold text-green-400 mb-3">1. WireGuard</h4>
                            <p className="text-gray-300 text-sm mb-4">
                              Aplicativo para conexão VPN segura
                            </p>
                            <Button 
                              onClick={() => window.open('https://play.google.com/store/apps/details?id=com.wireguard.android', '_blank')}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar WireGuard
                            </Button>
                          </div>
                          
                          <div className="p-4 sm:p-5 rounded-xl bg-orange-900/20 border border-orange-600/30">
                            <h4 className="text-lg font-semibold text-orange-400 mb-3">2. MikroTik App</h4>
                            <p className="text-gray-300 text-sm mb-4">
                              Aplicativo oficial para gerenciar MikroTiks
                            </p>
                            <Button 
                              onClick={() => window.open('https://play.google.com/store/apps/details?id=com.mikrotik.android.tikapp', '_blank')}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar MikroTik App
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-600/30">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <AlertCircle className="w-5 h-5 text-blue-400 mr-2" />
                          Instruções para Android
                        </h4>
                        <ol className="text-gray-300 space-y-3 text-sm">
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">1.</span>
                            <div>
                              <strong>Configure o WireGuard:</strong> Escaneie o QR Code da sua conexão ou copie a configuração
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">2.</span>
                            <div>
                              <strong>Ative a VPN:</strong> Toque no botão para conectar à VPN WireGuard
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">3.</span>
                            <div>
                              <strong>Abra o MikroTik App:</strong> Use o aplicativo oficial para gerenciar seus roteadores
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">4.</span>
                            <div>
                              <strong>Conecte ao MikroTik:</strong> Insira o <strong className="text-blue-400">IP do seu MikroTik</strong>, usuário e senha
                            </div>
                          </li>
                        </ol>
                      </div>
                    </>
                  )}

                  {selectedPlatform === 'ios' && (
                    <>
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                          <Smartphone className="h-10 w-10 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">iOS</h3>
                        <p className="text-gray-400 mb-6">
                          Baixe os aplicativos necessários para acessar seus MikroTiks
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                          <div className="p-4 sm:p-5 rounded-xl bg-blue-900/20 border border-blue-600/30">
                            <h4 className="text-lg font-semibold text-blue-400 mb-3">1. WireGuard</h4>
                            <p className="text-gray-300 text-sm mb-4">
                              Aplicativo para conexão VPN segura
                            </p>
                            <Button 
                              onClick={() => window.open('https://apps.apple.com/us/app/wireguard/id1441195209', '_blank')}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar WireGuard
                            </Button>
                          </div>
                          
                          <div className="p-4 sm:p-5 rounded-xl bg-orange-900/20 border border-orange-600/30">
                            <h4 className="text-lg font-semibold text-orange-400 mb-3">2. MikroTik App</h4>
                            <p className="text-gray-300 text-sm mb-4">
                              Aplicativo oficial para gerenciar MikroTiks
                            </p>
                            <Button 
                              onClick={() => window.open('https://apps.apple.com/us/app/mikrotik/id1129523072', '_blank')}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar MikroTik App
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-600/30">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <AlertCircle className="w-5 h-5 text-blue-400 mr-2" />
                          Instruções para iOS
                        </h4>
                        <ol className="text-gray-300 space-y-3 text-sm">
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">1.</span>
                            <div>
                              <strong>Configure o WireGuard:</strong> Escaneie o QR Code da sua conexão ou adicione a configuração manualmente
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">2.</span>
                            <div>
                              <strong>Ative a VPN:</strong> Toque no botão para conectar à VPN WireGuard
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">3.</span>
                            <div>
                              <strong>Abra o MikroTik App:</strong> Use o aplicativo oficial para gerenciar seus roteadores
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">4.</span>
                            <div>
                              <strong>Conecte ao MikroTik:</strong> Insira o <strong className="text-blue-400">IP do seu MikroTik</strong>, usuário e senha
                            </div>
                          </li>
                        </ol>
                      </div>
                    </>
                  )}

                  {selectedPlatform === 'windows' && (
                    <>
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                          <Monitor className="h-10 w-10 text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Windows</h3>
                        <p className="text-gray-400 mb-6">
                          Baixe os aplicativos necessários para acessar seus MikroTiks
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                          <div className="p-4 sm:p-5 rounded-xl bg-purple-900/20 border border-purple-600/30">
                            <h4 className="text-lg font-semibold text-purple-400 mb-3">1. WireGuard</h4>
                            <p className="text-gray-300 text-sm mb-4">
                              Cliente VPN para Windows
                            </p>
                            <Button 
                              onClick={() => window.open('https://download.wireguard.com/windows-client/wireguard-installer.exe', '_blank')}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar WireGuard
                            </Button>
                          </div>
                          
                          <div className="p-4 sm:p-5 rounded-xl bg-orange-900/20 border border-orange-600/30">
                            <h4 className="text-lg font-semibold text-orange-400 mb-3">2. Winbox</h4>
                            <p className="text-gray-300 text-sm mb-4">
                              Aplicativo oficial para gerenciar MikroTiks
                            </p>
                            <Button 
                              onClick={() => window.open('https://mikrotik.com/download', '_blank')}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar Winbox
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-600/30">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <AlertCircle className="w-5 h-5 text-blue-400 mr-2" />
                          Instruções para Windows
                        </h4>
                        <ol className="text-gray-300 space-y-3 text-sm">
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">1.</span>
                            <div>
                              <strong>Instale o WireGuard:</strong> Execute o instalador e configure usando o arquivo .conf baixado
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">2.</span>
                            <div>
                              <strong>Ative a VPN:</strong> Clique em "Activate" no WireGuard para conectar
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">3.</span>
                            <div>
                              <strong>Abra o Winbox:</strong> Execute o Winbox (não precisa instalar)
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 font-bold mr-3 mt-1">4.</span>
                            <div>
                              <strong>Conecte ao MikroTik:</strong> Insira o <strong className="text-blue-400">IP do seu MikroTik</strong>, usuário e senha
                            </div>
                          </li>
                        </ol>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>

        {/* QR Code Modal */}
        <Dialog.Root open={qrModalOpen} onOpenChange={setQrModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 z-50 p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
              aria-describedby="qr-dialog-description"
            >
              {userPeer && (() => {
                const clientConfig = generateClientConfig()
                
                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title className="text-xl font-semibold text-white flex items-center">
                        <QrCode className="w-6 h-6 text-purple-400 mr-2" />
                        QR Code WireGuard
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
                      {clientConfig ? (
                        <>
                          {/* QR Code */}
                          <div className="bg-white p-4 sm:p-6 rounded-lg inline-block">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(clientConfig)}`}
                              alt="QR Code WireGuard"
                              className="w-60 h-60 sm:w-72 sm:h-72"
                            />
                          </div>

                          <div className="space-y-3">
                            <p className="text-sm text-gray-300">
                              📱 Escaneie este QR Code com o app WireGuard no seu dispositivo
                            </p>
                            
                            <div className="flex flex-col sm:flex-row justify-center gap-3">
                              <Button
                                onClick={handleCopyConfig}
                                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
                              >
                                {copiedConfig === 'copied' ? (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Copiado!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copiar Config
                                  </>
                                )}
                              </Button>
                              
                              <Button
                                onClick={() => {
                                  if (clientConfig) {
                                    const blob = new Blob([clientConfig], { type: 'text/plain' })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `${user?.nome || 'usuario'}-winbox-wireguard.conf`
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
                                variant="outline"
                                className="border-blue-600 text-blue-400 hover:text-blue-300 hover:border-blue-500 flex-1 sm:flex-none"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download .conf
                              </Button>
                            </div>
                          </div>

                          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-left">
                            <p className="text-xs text-gray-400 mb-2">📋 Configuração WireGuard:</p>
                            <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                              {clientConfig}
                            </pre>
                          </div>
                        </>
                      ) : (
                        <div className="py-8">
                          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-white mb-2">Configuração Indisponível</h3>
                          <p className="text-gray-400">
                            Não foi possível gerar a configuração do WireGuard. Verifique se o peer foi criado corretamente.
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