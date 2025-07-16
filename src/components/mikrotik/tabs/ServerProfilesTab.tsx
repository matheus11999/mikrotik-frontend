/**
 * 🛠️ Server Profiles Tab
 * 
 * Gerenciamento de Server Profiles do hotspot MikroTik
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Settings, 
  Edit, 
  Trash2, 
  RefreshCw,
  Wifi,
  Shield,
  Globe
} from 'lucide-react'

// Components
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { useToast } from '../../ui/toast'
import EditServerProfileModal from '../../modals/EditServerProfileModal'

interface ServerProfilesTabProps {
  mikrotikId: string
  mikrotikName: string
  session: any
  baseUrl: string
  headers: Record<string, string>
  onRefresh?: () => void
}

interface ServerProfile {
  '.id': string
  name: string
  'hotspot-address'?: string
  'dns-name'?: string
  'html-directory'?: string
  'http-proxy'?: string
  'login-by'?: string
  'use-radius'?: string
  'nas-identifier'?: string
  'nas-port-type'?: string
  'accounting'?: string
  disabled?: string
}

const ServerProfilesTab: React.FC<ServerProfilesTabProps> = ({
  mikrotikId,
  mikrotikName,
  session,
  baseUrl,
  headers,
  onRefresh
}) => {
  const { addToast } = useToast()

  // States
  const [serverProfiles, setServerProfiles] = useState<ServerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingProfile, setEditingProfile] = useState<ServerProfile | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Fetch server profiles
  const fetchServerProfiles = useCallback(async () => {
    if (!mikrotikId || !baseUrl) {
      console.log('[ServerProfilesTab] Skipping fetch - missing mikrotikId or baseUrl:', { mikrotikId, baseUrl })
      return
    }

    try {
      console.log('[ServerProfilesTab] Fetching server profiles for MikroTik:', mikrotikId, 'using baseUrl:', baseUrl)
      
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/profile`, {
        headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[ServerProfilesTab] Server profiles response:', data)
      
      const profilesData = data.success && data.data ? data.data : (Array.isArray(data) ? data : [])
      setServerProfiles(profilesData)
      
      console.log('[ServerProfilesTab] Server profiles loaded:', profilesData?.length || 0)
    } catch (error) {
      console.error('[ServerProfilesTab] Error fetching server profiles:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao carregar server profiles: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }, [mikrotikId, baseUrl, headers, addToast])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (mikrotikId && baseUrl && session) {
        console.log('[ServerProfilesTab] Loading server profiles data...', { 
          mikrotikId, 
          baseUrl, 
          hasSession: !!session 
        })
        setLoading(true)
        try {
          await fetchServerProfiles()
        } finally {
          setLoading(false)
        }
      } else {
        console.log('[ServerProfilesTab] Missing required data:', { 
          mikrotikId: !!mikrotikId, 
          baseUrl: !!baseUrl, 
          session: !!session 
        })
      }
    }

    loadData()
  }, [mikrotikId, baseUrl, session, fetchServerProfiles])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchServerProfiles()
      addToast({
        type: 'success',
        title: 'Atualizado!',
        description: 'Server profiles atualizados com sucesso'
      })
    } finally {
      setRefreshing(false)
    }
  }, [fetchServerProfiles, addToast])

  // Handle edit profile
  const handleEditProfile = (profile: ServerProfile) => {
    setEditingProfile(profile)
    setEditModalOpen(true)
  }

  // Handle save profile
  const handleSaveProfile = async (profileData: any) => {
    if (!editingProfile) return

    try {
      console.log('[ServerProfilesTab] Saving profile:', profileData)
      
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/server/profile/${encodeURIComponent(editingProfile['.id'])}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(profileData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Refresh data after successful update
      await fetchServerProfiles()
      
      console.log('[ServerProfilesTab] Profile saved successfully')
    } catch (error) {
      console.error('[ServerProfilesTab] Error saving profile:', error)
      throw error
    }
  }

  // Handle delete profile
  const handleDeleteProfile = async (profile: ServerProfile) => {
    if (!confirm(`Tem certeza que deseja excluir o server profile "${profile.name}"?`)) {
      return
    }

    try {
      console.log('[ServerProfilesTab] Deleting profile:', profile['.id'])
      
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/server/profile/${encodeURIComponent(profile['.id'])}`, {
        method: 'DELETE',
        headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Refresh data after successful deletion
      await fetchServerProfiles()
      
      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'Server profile excluído com sucesso'
      })
      
      console.log('[ServerProfilesTab] Profile deleted successfully')
    } catch (error) {
      console.error('[ServerProfilesTab] Error deleting profile:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao excluir server profile: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }

  // Filter profiles
  const filteredProfiles = serverProfiles.filter(profile =>
    profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile['dns-name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile['hotspot-address']?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get profile status
  const getProfileStatus = (profile: ServerProfile) => {
    return profile.disabled === 'true' ? 'Desabilitado' : 'Ativo'
  }

  // Get profile status color
  const getProfileStatusColor = (profile: ServerProfile) => {
    return profile.disabled === 'true' ? 'destructive' : 'success'
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
          <h2 className="text-2xl font-bold text-white mb-2">Server Profiles</h2>
          <p className="text-gray-400">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? 'profile encontrado' : 'profiles encontrados'}
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
          placeholder="Buscar server profiles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-black/40 border-gray-800/50 text-white"
        />
      </div>

      {/* Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <Card className="bg-black/40 border-gray-800/50 p-8 text-center">
          <Settings className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {searchTerm ? 'Nenhum profile encontrado' : 'Nenhum server profile'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : 'Configure server profiles para gerenciar configurações de hotspot'
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile, index) => (
            <motion.div
              key={profile['.id']}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-blue-500/50 transition-all duration-300 group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <Wifi className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {profile.name}
                      </h3>
                      <Badge 
                        variant={getProfileStatusColor(profile) as any}
                        className="mt-1"
                      >
                        {getProfileStatus(profile)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-3">
                  {profile['hotspot-address'] && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        {profile['hotspot-address']}
                      </span>
                    </div>
                  )}

                  {profile['dns-name'] && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        DNS: {profile['dns-name']}
                      </span>
                    </div>
                  )}

                  {profile['html-directory'] && (
                    <div className="flex items-center gap-2 text-sm">
                      <Settings className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        Dir: {profile['html-directory']}
                      </span>
                    </div>
                  )}

                  {profile['login-by'] && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        Login: {profile['login-by']}
                      </span>
                    </div>
                  )}

                  {profile['use-radius'] && (
                    <div className="flex items-center gap-2 text-sm">
                      <Settings className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        RADIUS: {profile['use-radius']}
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
                    onClick={() => handleEditProfile(profile)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs border-red-600/30 text-red-400 hover:bg-red-600/10"
                    onClick={() => handleDeleteProfile(profile)}
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
      {editingProfile && (
        <EditServerProfileModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingProfile(null)
          }}
          profile={editingProfile}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  )
}

export default ServerProfilesTab