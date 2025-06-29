import React, { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  DollarSign,
  Database,
  MessageSquare,
  Clock,
  Wifi,
  X
} from 'lucide-react'

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

interface HotspotProfilesTabProps {
  profiles: HotspotProfile[]
  onCreateProfile: () => void
  onEditProfile: (profile: HotspotProfile) => void
  onDeleteProfile: (profile: HotspotProfile) => void
  onSyncProfile: (profile: HotspotProfile, valor?: string) => void
  loading?: boolean
}

const HotspotProfilesTab: React.FC<HotspotProfilesTabProps> = ({
  profiles,
  onCreateProfile,
  onEditProfile,
  onDeleteProfile,
  onSyncProfile,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [syncModal, setSyncModal] = useState<{ isOpen: boolean; profile: HotspotProfile | null }>({
    isOpen: false,
    profile: null
  })
  const [syncValue, setSyncValue] = useState('')

  const filteredProfiles = profiles
    .filter(profile => 
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile['rate-limit'] && profile['rate-limit'].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (profile.comment && profile.comment.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      // First, sort by sync status (synchronized first)
      if (a.inDatabase && !b.inDatabase) return -1
      if (!a.inDatabase && b.inDatabase) return 1
      
      // Then sort by name
      return a.name.localeCompare(b.name)
    })

  const formatTime = (seconds: string) => {
    const sec = parseInt(seconds)
    if (sec >= 3600) {
      return `${(sec / 3600).toFixed(1)}h`
    } else if (sec >= 60) {
      return `${(sec / 60).toFixed(0)}min`
    }
    return `${sec}s`
  }

  const openSyncModal = (profile: HotspotProfile) => {
    setSyncModal({ isOpen: true, profile })
    setSyncValue(profile.valor?.toString() || '0')
  }

  const closeSyncModal = () => {
    setSyncModal({ isOpen: false, profile: null })
    setSyncValue('')
  }

  const handleSync = () => {
    if (syncModal.profile) {
      onSyncProfile(syncModal.profile, syncValue)
      closeSyncModal()
    }
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
          <h2 className="text-xl sm:text-2xl font-bold text-white">Planos Hotspot</h2>
          <p className="text-sm text-gray-400 mt-1">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? 'plano' : 'planos'} 
            {searchTerm && ` encontrado${filteredProfiles.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button 
          onClick={onCreateProfile} 
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Search */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar planos por nome, velocidade ou comentário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 sm:py-4 bg-black border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-base sm:text-lg"
          />
        </div>
      </div>

      {/* Profiles List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {filteredProfiles.length === 0 ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="text-center max-w-md px-4">
              <div className="relative mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <Plus className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                {searchTerm ? 'Nenhum plano encontrado' : 'Nenhum plano cadastrado'}
              </h3>
              <p className="text-gray-400 mb-8 text-base sm:text-lg">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca para encontrar o que procura'
                  : 'Comece criando seu primeiro plano para o hotspot'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={onCreateProfile} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium shadow-lg transition-all duration-300 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Criar Primeiro Plano
                </Button>
              )}
            </div>
          </div>
        ) : (
          filteredProfiles.map(profile => (
            <Card key={profile['.id']} className="relative bg-black border border-gray-800 hover:border-blue-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer shadow-lg p-4 sm:p-6 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${!profile.disabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 mb-3">
                      <h3 className="font-semibold text-white text-lg">{profile.name}</h3>
                      
                      {/* Sync Badge - Side Banner */}
                      {profile.inDatabase && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-lg z-10">
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            <span>SINCRONIZADO</span>
                          </div>
                        </div>
                      )}

                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Price Indicator */}
                        {profile.valor && profile.valor > 0 && (
                          <div className="flex items-center gap-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/40 px-3 py-1.5 rounded-full">
                            <DollarSign className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-blue-300 font-bold tracking-wide">
                              R$ {profile.valor.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {/* Comment Indicator */}
                        {profile.comment && (
                          <div className="flex items-center gap-1 bg-gray-600/20 border border-gray-500/40 px-2 py-1 rounded-full">
                            <MessageSquare className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-400" title={profile.comment}>
                              Comentário
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      {/* Speed */}
                      {profile['rate-limit'] && (
                        <div className="flex items-center gap-1">
                          <Wifi className="h-3 w-3 text-blue-400" />
                          <span className="text-gray-400">Velocidade:</span>
                          <span className="text-blue-400 font-medium">{profile['rate-limit']}</span>
                        </div>
                      )}
                      
                      {/* Session Timeout */}
                      {profile['session-timeout'] && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-yellow-400" />
                          <span className="text-gray-400">Sessão:</span>
                          <span className="text-yellow-400 font-medium">
                            {formatTime(profile['session-timeout'])}
                          </span>
                        </div>
                      )}
                      
                      {/* Idle Timeout */}
                      {profile['idle-timeout'] && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-orange-400" />
                          <span className="text-gray-400">Inativo:</span>
                          <span className="text-orange-400 font-medium">
                            {formatTime(profile['idle-timeout'])}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Comment */}
                    {profile.comment && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 bg-gray-800 rounded px-2 py-1 inline-block">
                          {profile.comment}
                        </p>
                      </div>
                    )}

                    {/* Status */}
                    <p className="text-xs text-gray-500 mt-1">
                      Status: <span className={profile.disabled ? 'text-red-400' : 'text-green-400'}>
                        {profile.disabled ? 'Inativo' : 'Ativo'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Sync to Database */}
                  {!profile.inDatabase && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openSyncModal(profile)}
                      className="border-green-600/50 text-green-400 hover:text-green-300 hover:bg-green-600/10"
                      title="Sincronizar com banco de dados"
                    >
                      <Database className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Edit */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEditProfile(profile)}
                    className="border-blue-600/50 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
                    title="Editar plano"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Delete */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDeleteProfile(profile)}
                    className="border-red-600/50 text-red-400 hover:text-red-300 hover:bg-red-600/10"
                    title="Excluir plano"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Sync Modal */}
      {syncModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black rounded-lg p-6 w-full max-w-md border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">
                  Sincronizar Plano
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={closeSyncModal}
                className="border-gray-600 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-300 mb-2">
                  Plano: <strong className="text-white">{syncModal.profile?.name}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Este plano será sincronizado com o banco de dados.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor do Plano (R$) *
                </label>
                <div className="relative">
                  <DollarSign className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={syncValue}
                    onChange={(e) => setSyncValue(e.target.value)}
                    placeholder="0.00"
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Informe o valor que será cobrado por este plano
                </p>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  💡 <strong>Dica:</strong> Após sincronizar, este plano ficará disponível no banco de dados 
                  e será automaticamente gerenciado junto com o MikroTik.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSync}
                  disabled={!syncValue || parseFloat(syncValue) < 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Sincronizar
                </Button>
                <Button
                  variant="outline"
                  onClick={closeSyncModal}
                  className="flex-1 border-gray-600 text-gray-300 hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HotspotProfilesTab