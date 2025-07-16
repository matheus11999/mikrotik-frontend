/**
 * 🖥️ Servers Tab
 * 
 * Gerenciamento de Servidores Hotspot do MikroTik
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Server, 
  Edit, 
  Trash2, 
  RefreshCw,
  Network,
  Shield,
  Globe,
  Activity,
  Wifi
} from 'lucide-react'

// Components
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { useToast } from '../../ui/toast'
import EditServerModal from '../../modals/EditServerModal'

interface ServersTabProps {
  mikrotikId: string
  mikrotikName: string
  session: any
  baseUrl: string
  headers: Record<string, string>
  onRefresh?: () => void
}

interface HotspotServer {
  '.id': string
  name: string
  interface?: string
  'address-pool'?: string
  profile?: string
  'ip-of-dns-name'?: string
  'addresses-per-mac'?: string
  disabled?: string
  invalid?: string
}

const ServersTab: React.FC<ServersTabProps> = ({
  mikrotikId,
  mikrotikName,
  session,
  baseUrl,
  headers,
  onRefresh
}) => {
  const { addToast } = useToast()

  // States
  const [servers, setServers] = useState<HotspotServer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingServer, setEditingServer] = useState<HotspotServer | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Fetch servers
  const fetchServers = useCallback(async () => {
    if (!mikrotikId || !baseUrl) {
      console.log('[ServersTab] Skipping fetch - missing mikrotikId or baseUrl:', { mikrotikId, baseUrl })
      return
    }

    try {
      console.log('[ServersTab] Fetching hotspot servers for MikroTik:', mikrotikId, 'using baseUrl:', baseUrl)
      
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot`, {
        headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[ServersTab] Servers response:', data)
      
      const serversData = data.success && data.data ? data.data : (Array.isArray(data) ? data : [])
      setServers(serversData)
      
      console.log('[ServersTab] Servers loaded:', serversData?.length || 0)
    } catch (error) {
      console.error('[ServersTab] Error fetching servers:', error)
      
      // Se o endpoint não existe no MikroTik, mostrar aviso informativo
      if (error instanceof Error && error.message.includes('400')) {
        addToast({
          type: 'warning',
          title: 'Recurso não disponível',
          description: 'Este MikroTik não suporta listagem de servidores hotspot via API'
        })
        setServers([]) // Lista vazia
      } else {
        addToast({
          type: 'error',
          title: 'Erro!',
          description: 'Erro ao carregar servidores: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
        })
      }
    }
  }, [mikrotikId, baseUrl, headers, addToast])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (mikrotikId && baseUrl && session) {
        console.log('[ServersTab] Loading servers data...', { 
          mikrotikId, 
          baseUrl, 
          hasSession: !!session 
        })
        setLoading(true)
        try {
          await fetchServers()
        } finally {
          setLoading(false)
        }
      } else {
        console.log('[ServersTab] Missing required data:', { 
          mikrotikId: !!mikrotikId, 
          baseUrl: !!baseUrl, 
          session: !!session 
        })
      }
    }

    loadData()
  }, [mikrotikId, baseUrl, session, fetchServers])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchServers()
      addToast({
        type: 'success',
        title: 'Atualizado!',
        description: 'Servidores atualizados com sucesso'
      })
    } finally {
      setRefreshing(false)
    }
  }, [fetchServers, addToast])

  // Handle edit server
  const handleEditServer = (server: HotspotServer) => {
    setEditingServer(server)
    setEditModalOpen(true)
  }

  // Handle save server
  const handleSaveServer = async (serverData: any) => {
    if (!editingServer) return

    try {
      console.log('[ServersTab] Saving server:', serverData)
      
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/server/${encodeURIComponent(editingServer['.id'])}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(serverData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Refresh data after successful update
      await fetchServers()
      
      console.log('[ServersTab] Server saved successfully')
    } catch (error) {
      console.error('[ServersTab] Error saving server:', error)
      throw error
    }
  }

  // Handle delete server
  const handleDeleteServer = async (server: HotspotServer) => {
    if (!confirm(`Tem certeza que deseja excluir o servidor "${server.name}"?`)) {
      return
    }

    try {
      console.log('[ServersTab] Deleting server:', server['.id'])
      
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/server/${encodeURIComponent(server['.id'])}`, {
        method: 'DELETE',
        headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Refresh data after successful deletion
      await fetchServers()
      
      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'Servidor excluído com sucesso'
      })
      
      console.log('[ServersTab] Server deleted successfully')
    } catch (error) {
      console.error('[ServersTab] Error deleting server:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao excluir servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  // Filter servers
  const filteredServers = servers.filter(server =>
    server.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.interface?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.profile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server['address-pool']?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get server status
  const getServerStatus = (server: HotspotServer) => {
    if (server.invalid === 'true') return 'Inválido'
    if (server.disabled === 'true') return 'Desabilitado'
    return 'Ativo'
  }

  // Get server status color
  const getServerStatusColor = (server: HotspotServer) => {
    if (server.invalid === 'true') return 'destructive'
    if (server.disabled === 'true') return 'secondary'
    return 'success'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-700/30 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-700/30 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-black/40 border border-gray-800/50 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-gray-700/30 rounded mb-4"></div>
              <div className="space-y-2">
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
          <h2 className="text-2xl font-bold text-white mb-2">Servidores Hotspot</h2>
          <p className="text-gray-400">
            {filteredServers.length} {filteredServers.length === 1 ? 'servidor encontrado' : 'servidores encontrados'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar servidores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-black/40 border-gray-800/50 text-white"
        />
      </div>

      {/* Servers Grid */}
      {filteredServers.length === 0 ? (
        <Card className="bg-black/40 border-gray-800/50 p-8 text-center">
          <Server className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {searchTerm ? 'Nenhum servidor encontrado' : 'Nenhum servidor hotspot'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : 'Configure servidores hotspot para fornecer acesso à internet'
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server, index) => (
            <motion.div
              key={server['.id']}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-blue-500/50 transition-all duration-300 group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      getServerStatus(server) === 'Ativo' 
                        ? 'bg-green-600/20' 
                        : getServerStatus(server) === 'Inválido'
                        ? 'bg-red-600/20'
                        : 'bg-gray-600/20'
                    }`}>
                      <Server className={`h-5 w-5 ${
                        getServerStatus(server) === 'Ativo' 
                          ? 'text-green-400' 
                          : getServerStatus(server) === 'Inválido'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {server.name}
                      </h3>
                      <Badge 
                        variant={getServerStatusColor(server) as any}
                        className="mt-1"
                      >
                        {getServerStatus(server)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Server Details */}
                <div className="space-y-3">
                  {server.interface && (
                    <div className="flex items-center gap-2 text-sm">
                      <Network className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        Interface: {server.interface}
                      </span>
                    </div>
                  )}

                  {server.profile && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        Profile: {server.profile}
                      </span>
                    </div>
                  )}

                  {server['address-pool'] && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        Pool: {server['address-pool']}
                      </span>
                    </div>
                  )}

                  {server['ip-of-dns-name'] && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        DNS: {server['ip-of-dns-name']}
                      </span>
                    </div>
                  )}

                  {server['addresses-per-mac'] && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        Endereços/MAC: {server['addresses-per-mac']}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800/50">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => handleEditServer(server)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs border-red-600/30 text-red-400 hover:bg-red-600/10"
                    onClick={() => handleDeleteServer(server)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Deletar
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingServer && (
        <EditServerModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingServer(null)
          }}
          server={editingServer}
          onSave={handleSaveServer}
        />
      )}
    </div>
  )
}

export default ServersTab