import React, { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Database,
  Globe,
  MessageSquare,
  Folder
} from 'lucide-react'

interface HotspotServerProfile {
  '.id': string
  name: string
  'html-directory'?: string
  'login-page'?: string
  'split-user-domain'?: string
  disabled?: boolean
  comment?: string
}

interface HotspotServerProfilesTabProps {
  serverProfiles: HotspotServerProfile[]
  onCreateServerProfile: () => void
  onEditServerProfile: (serverProfile: HotspotServerProfile) => void
  onDeleteServerProfile: (serverProfile: HotspotServerProfile) => void
  loading?: boolean
}

const HotspotServerProfilesTab: React.FC<HotspotServerProfilesTabProps> = ({
  serverProfiles,
  onCreateServerProfile,
  onEditServerProfile,
  onDeleteServerProfile,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredServerProfiles = serverProfiles.filter(profile => 
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile['html-directory'] && profile['html-directory'].toLowerCase().includes(searchTerm.toLowerCase())) ||
    (profile['login-page'] && profile['login-page'].toLowerCase().includes(searchTerm.toLowerCase())) ||
    (profile.comment && profile.comment.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h2 className="text-xl sm:text-2xl font-bold text-white">Perfis de Servidor Hotspot</h2>
          <p className="text-sm text-gray-400 mt-1">
            {filteredServerProfiles.length} {filteredServerProfiles.length === 1 ? 'perfil' : 'perfis'} 
            {searchTerm && ` encontrado${filteredServerProfiles.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button 
          onClick={onCreateServerProfile} 
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil de Servidor
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Buscar perfis por nome, diretório HTML ou comentário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-900 border-gray-700"
        />
      </div>

      {/* Server Profiles List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredServerProfiles.length === 0 ? (
          <Card className="bg-black border-gray-800 p-8 text-center">
            <p className="text-gray-400">
              {searchTerm ? 'Nenhum perfil encontrado para a busca.' : 'Nenhum perfil de servidor cadastrado.'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={onCreateServerProfile} 
                variant="outline" 
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Perfil
              </Button>
            )}
          </Card>
        ) : (
          filteredServerProfiles.map(profile => (
            <Card key={profile['.id']} className="bg-black border-gray-800 p-4 hover:bg-gray-900 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${!profile.disabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{profile.name}</h3>
                      
                      {/* Comment Indicator */}
                      {profile.comment && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400" title={profile.comment}>
                            Comentário
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {/* HTML Directory */}
                      {profile['html-directory'] && (
                        <div className="flex items-center gap-1">
                          <Folder className="h-3 w-3 text-blue-400" />
                          <span className="text-gray-400">Diretório HTML:</span>
                          <span className="text-blue-400 font-medium bg-gray-800 px-2 py-0.5 rounded text-xs">
                            {profile['html-directory']}
                          </span>
                        </div>
                      )}
                      
                      {/* Login Page */}
                      {profile['login-page'] && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-green-400" />
                          <span className="text-gray-400">Página de Login:</span>
                          <span className="text-green-400 font-medium bg-gray-800 px-2 py-0.5 rounded text-xs">
                            {profile['login-page']}
                          </span>
                        </div>
                      )}
                      
                      {/* Split User Domain */}
                      {profile['split-user-domain'] && (
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3 text-purple-400" />
                          <span className="text-gray-400">Dividir Domínio:</span>
                          <span className="text-purple-400 font-medium">
                            {profile['split-user-domain'] === 'yes' ? 'Sim' : 'Não'}
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
                    <p className="text-xs text-gray-500 mt-2">
                      Status: <span className={profile.disabled ? 'text-red-400' : 'text-green-400'}>
                        {profile.disabled ? 'Inativo' : 'Ativo'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Edit */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEditServerProfile(profile)}
                    className="border-blue-600/50 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
                    title="Editar perfil de servidor"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Delete */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDeleteServerProfile(profile)}
                    className="border-red-600/50 text-red-400 hover:text-red-300 hover:bg-red-600/10"
                    title="Excluir perfil de servidor"
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

export default HotspotServerProfilesTab