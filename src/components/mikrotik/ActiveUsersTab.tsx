import React, { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { 
  Search, 
  Power,
  Wifi,
  Monitor,
  MapPin,
  Clock,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'

interface ActiveUser {
  '.id': string
  user: string
  address: string
  'mac-address': string
  'login-time': string
  uptime: string
  'bytes-in': string
  'bytes-out': string
  'session-time-left'?: string
  'idle-time'?: string
  radius?: string
}

interface ActiveUsersTabProps {
  activeUsers: ActiveUser[]
  onDisconnectUser: (userId: string) => void
  onRefresh: () => void
  loading?: boolean
}

const ActiveUsersTab: React.FC<ActiveUsersTabProps> = ({
  activeUsers,
  onDisconnectUser,
  onRefresh,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = activeUsers.filter(user => 
    user.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user['mac-address'].toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatBytes = (bytes: string) => {
    const value = parseFloat(bytes)
    if (value >= 1024 * 1024 * 1024) {
      return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
    } else if (value >= 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(2)} MB`
    } else if (value >= 1024) {
      return `${(value / 1024).toFixed(2)} KB`
    }
    return `${value} B`
  }

  const formatTime = (timeStr: string) => {
    // Handle various time formats from MikroTik
    if (timeStr.includes('d')) {
      return timeStr // Already formatted like "1d2h3m4s"
    }
    
    // Convert seconds to readable format
    const seconds = parseInt(timeStr)
    if (isNaN(seconds)) return timeStr

    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    let result = ''
    if (days > 0) result += `${days}d `
    if (hours > 0) result += `${hours}h `
    if (minutes > 0) result += `${minutes}m `
    if (secs > 0 || result === '') result += `${secs}s`

    return result.trim()
  }

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
          <h2 className="text-xl sm:text-2xl font-bold text-white">Usuários Ativos</h2>
          <p className="text-sm text-gray-400 mt-1">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário conectado' : 'usuários conectados'} 
            {searchTerm && ` encontrado${filteredUsers.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button 
          onClick={onRefresh} 
          variant="outline"
          className="border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600 w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Buscar por usuário, IP ou MAC address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-900 border-gray-700"
        />
      </div>

      {/* Active Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredUsers.length === 0 ? (
          <Card className="col-span-full bg-black border-gray-800 p-8 text-center">
            <div className="flex flex-col items-center">
              <Wifi className="h-12 w-12 text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-2">
                {searchTerm ? 'Nenhum usuário encontrado para a busca.' : 'Nenhum usuário conectado no momento.'}
              </p>
              <p className="text-gray-500 text-sm">
                Os usuários aparecerão aqui quando se conectarem ao hotspot.
              </p>
            </div>
          </Card>
        ) : (
          filteredUsers.map(user => (
            <Card key={user['.id']} className="bg-black border-gray-800 p-4 hover:bg-gray-900 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{user.user}</h3>
                      <div className="flex items-center gap-1 bg-green-600/20 px-2 py-1 rounded">
                        <Wifi className="h-3 w-3 text-green-400" />
                        <span className="text-xs text-green-400">Online</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      {/* Connection Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-blue-400" />
                          <span className="text-gray-400">IP:</span>
                          <span className="text-blue-400 font-medium">{user.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3 text-purple-400" />
                          <span className="text-gray-400">MAC:</span>
                          <span className="text-purple-400 font-mono text-xs">
                            {user['mac-address']}
                          </span>
                        </div>
                      </div>

                      {/* Time Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-yellow-400" />
                          <span className="text-gray-400">Login:</span>
                          <span className="text-yellow-400 text-xs">
                            {new Date(user['login-time']).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-orange-400" />
                          <span className="text-gray-400">Online:</span>
                          <span className="text-orange-400 font-medium">
                            {formatTime(user.uptime)}
                          </span>
                        </div>
                      </div>

                      {/* Data Usage */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3 text-green-400" />
                          <span className="text-gray-400">Download:</span>
                          <span className="text-green-400 font-medium">
                            {formatBytes(user['bytes-in'])}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Upload className="h-3 w-3 text-red-400" />
                          <span className="text-gray-400">Upload:</span>
                          <span className="text-red-400 font-medium">
                            {formatBytes(user['bytes-out'])}
                          </span>
                        </div>
                      </div>

                      {/* Session Info */}
                      <div className="space-y-1">
                        {user['session-time-left'] && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-cyan-400" />
                            <span className="text-gray-400">Restante:</span>
                            <span className="text-cyan-400 font-medium">
                              {formatTime(user['session-time-left'])}
                            </span>
                          </div>
                        )}
                        {user['idle-time'] && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-400">Inativo:</span>
                            <span className="text-gray-400">
                              {formatTime(user['idle-time'])}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total Usage Summary */}
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-500">
                        Total transferido: {formatBytes((parseFloat(user['bytes-in']) + parseFloat(user['bytes-out'])).toString())}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Disconnect */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDisconnectUser(user['.id'])}
                    className="border-red-600/50 text-red-400 hover:text-red-300 hover:bg-red-600/10"
                    title="Desconectar usuário"
                  >
                    <Power className="h-4 w-4" />
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

export default ActiveUsersTab