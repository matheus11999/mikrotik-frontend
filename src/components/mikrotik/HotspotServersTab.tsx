import React, { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Server,
  Network,
  Settings,
  MessageSquare
} from 'lucide-react'

interface HotspotServer {
  '.id': string
  name: string
  interface?: string
  'address-pool'?: string
  profile?: string
  disabled?: boolean
  comment?: string
}

interface HotspotServersTabProps {
  servers: HotspotServer[]
  onCreateServer: () => void
  onEditServer: (server: HotspotServer) => void
  onDeleteServer: (server: HotspotServer) => void
  loading?: boolean
}

const HotspotServersTab: React.FC<HotspotServersTabProps> = ({
  servers,
  onCreateServer,
  onEditServer,
  onDeleteServer,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  // Helper function to check if server is active (handles string and boolean values)
  const getIsServerActive = (server: HotspotServer) => {
    if (typeof server.disabled === 'string') {
      return server.disabled !== 'true' && server.disabled !== 'yes'
    }
    return !server.disabled
  }

  const filteredServers = servers.filter(server => 
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (server.interface && server.interface.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (server['address-pool'] && server['address-pool'].toLowerCase().includes(searchTerm.toLowerCase())) ||
    (server.profile && server.profile.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (server.comment && server.comment.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Servidores Hotspot</h2>
          <p className="text-sm text-gray-400 mt-1">
            {filteredServers.length} {filteredServers.length === 1 ? 'servidor' : 'servidores'} 
            {searchTerm && ` encontrado${filteredServers.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button 
          onClick={onCreateServer} 
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Servidor
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Buscar servidores por nome, interface, pool ou comentário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-900 border-gray-700"
        />
      </div>

      {/* Servers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredServers.length === 0 ? (
          <Card className="bg-black border-gray-800 p-8 text-center">
            <p className="text-gray-400">
              {searchTerm ? 'Nenhum servidor encontrado para a busca.' : 'Nenhum servidor cadastrado.'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={onCreateServer} 
                variant="outline" 
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Servidor
              </Button>
            )}
          </Card>
        ) : (
          filteredServers.map(server => (
            <Card key={server['.id']} className="bg-black border-gray-800 p-4 hover:bg-gray-900 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${getIsServerActive(server) ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{server.name}</h3>
                      
                      {/* Comment Indicator */}
                      {server.comment && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400" title={server.comment}>
                            Comentário
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      {/* Interface */}
                      {server.interface && (
                        <div className="flex items-center gap-1">
                          <Network className="h-3 w-3 text-blue-400" />
                          <span className="text-gray-400">Interface:</span>
                          <span className="text-blue-400 font-medium">{server.interface}</span>
                        </div>
                      )}
                      
                      {/* Address Pool */}
                      {server['address-pool'] && (
                        <div className="flex items-center gap-1">
                          <Server className="h-3 w-3 text-green-400" />
                          <span className="text-gray-400">Pool:</span>
                          <span className="text-green-400 font-medium">{server['address-pool']}</span>
                        </div>
                      )}
                      
                      {/* Profile */}
                      {server.profile && (
                        <div className="flex items-center gap-1">
                          <Settings className="h-3 w-3 text-purple-400" />
                          <span className="text-gray-400">Perfil:</span>
                          <span className="text-purple-400 font-medium">{server.profile}</span>
                        </div>
                      )}
                    </div>

                    {/* Comment */}
                    {server.comment && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 bg-gray-800 rounded px-2 py-1 inline-block">
                          {server.comment}
                        </p>
                      </div>
                    )}

                    {/* Status */}
                    <p className="text-xs text-gray-500 mt-1">
                      Status: <span className={getIsServerActive(server) ? 'text-green-400' : 'text-red-400'}>
                        {getIsServerActive(server) ? 'Ativo' : 'Inativo'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Edit */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEditServer(server)}
                    className="border-blue-600/50 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
                    title="Editar servidor"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Delete */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDeleteServer(server)}
                    className="border-red-600/50 text-red-400 hover:text-red-300 hover:bg-red-600/10"
                    title="Excluir servidor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default HotspotServersTab