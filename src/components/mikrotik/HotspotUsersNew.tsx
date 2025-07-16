/**
 * 👥 Hotspot Users - Layout Redesenhado
 * 
 * Gerenciamento avançado de usuários hotspot com layout responsivo e moderno
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  Users,
  RefreshCw,
  Printer,
  UserPlus,
  Save,
  X,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Wifi,
  Activity
} from 'lucide-react'

// Components
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { useToast } from '../ui/toast'
import CreateUserModal from '../modals/CreateUserModal'
import BulkGenerateModal from '../modals/BulkGenerateModal'
import PrintUsersModal from '../modals/PrintUsersModal'

interface HotspotUsersProps {
  mikrotikId: string
  mikrotikName: string
  session: any
  baseUrl: string
  headers: Record<string, string>
  onRefresh?: () => void
}

interface HotspotUser {
  '.id': string
  name: string
  password?: string
  profile?: string
  comment?: string
  disabled?: string | boolean
  'bytes-in'?: string
  'bytes-out'?: string
  uptime?: string
}

interface HotspotProfile {
  '.id': string
  name: string
  'rate-limit'?: string
  'session-timeout'?: string
}

interface EditingUser extends HotspotUser {
  editingName?: boolean
  editingPassword?: boolean
  newName?: string
  newPassword?: string
  showPassword?: boolean
}

const HotspotUsersNew: React.FC<HotspotUsersProps> = ({
  mikrotikId,
  mikrotikName,
  session,
  baseUrl,
  headers,
  onRefresh
}) => {
  const { addToast } = useToast()

  // States
  const [users, setUsers] = useState<EditingUser[]>([])
  const [profiles, setProfiles] = useState<HotspotProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)

  const usersPerPage = 50 // Lista permite mais itens por página

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!mikrotikId || !baseUrl) return

    try {
      console.log('[HotspotUsers] Fetching users for MikroTik:', mikrotikId)
      
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user`, {
        headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[HotspotUsers] Users response:', data)
      
      const usersData = data.success && data.data ? data.data : (Array.isArray(data) ? data : [])
      setUsers(usersData.map((user: HotspotUser) => ({
        ...user,
        editingName: false,
        editingPassword: false,
        newName: user.name,
        newPassword: '',
        showPassword: false
      })))
      
      console.log('[HotspotUsers] Users loaded:', usersData?.length || 0)
    } catch (error) {
      console.error('[HotspotUsers] Error fetching users:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao carregar usuários: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }, [mikrotikId, baseUrl, headers, addToast])

  // Fetch profiles
  const fetchProfiles = useCallback(async () => {
    if (!mikrotikId || !baseUrl) return

    try {
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user/profile`, {
        headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const profilesData = data.success && data.data ? data.data : (Array.isArray(data) ? data : [])
      setProfiles(profilesData)
      
    } catch (error) {
      console.error('[HotspotUsers] Error fetching profiles:', error)
    }
  }, [mikrotikId, baseUrl, headers])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (mikrotikId && baseUrl && session) {
        setLoading(true)
        try {
          await Promise.all([fetchUsers(), fetchProfiles()])
        } finally {
          setLoading(false)
        }
      }
    }

    loadData()
  }, [mikrotikId, baseUrl, session, fetchUsers, fetchProfiles])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchUsers(), fetchProfiles()])
      addToast({
        type: 'success',
        title: 'Atualizado!',
        description: 'Usuários atualizados com sucesso'
      })
    } finally {
      setRefreshing(false)
    }
  }, [fetchUsers, fetchProfiles, addToast])

  // Handle create user
  const handleCreateUser = useCallback(async (userData: any) => {
    try {
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: userData.username,
          password: userData.password,
          profile: userData.profile,
          comment: userData.comment || '',
          disabled: userData.disabled ? 'yes' : 'no'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      await fetchUsers()
      addToast({
        type: 'success',
        title: 'Usuário criado!',
        description: `Usuário ${userData.username} criado com sucesso`
      })
      setShowCreateModal(false)
    } catch (error) {
      console.error('[HotspotUsers] Error creating user:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao criar usuário: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }, [mikrotikId, baseUrl, headers, fetchUsers, addToast])

  // Handle bulk generate
  const handleBulkGenerate = useCallback(async (generateData: any) => {
    try {
      const { quantity, profile } = generateData
      const usersToCreate = []
      
      // Gerar números únicos de 5 dígitos
      const usedNumbers = new Set()
      
      for (let i = 0; i < quantity; i++) {
        let username
        do {
          username = Math.floor(10000 + Math.random() * 90000).toString() // 5 dígitos
        } while (usedNumbers.has(username))
        
        usedNumbers.add(username)
        const password = Math.random().toString(36).substring(2, 10)
        
        usersToCreate.push({
          name: username,
          password: password,
          profile: profile,
          disabled: 'no'
        })
      }

      // Create users one by one (MikroTik API doesn't support bulk creation)
      let successCount = 0
      let errorCount = 0

      for (const userData of usersToCreate) {
        try {
          const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(userData)
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch {
          errorCount++
        }
      }

      await fetchUsers()
      addToast({
        type: successCount > 0 ? 'success' : 'error',
        title: 'Geração concluída!',
        description: `${successCount} usuários criados com sucesso${errorCount > 0 ? `, ${errorCount} falharam` : ''}`
      })
      setShowBulkModal(false)
    } catch (error) {
      console.error('[HotspotUsers] Error bulk generating:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro na geração em massa: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }, [mikrotikId, baseUrl, headers, fetchUsers, addToast])

  // Handle delete user
  const handleDeleteUser = useCallback(async (user: EditingUser) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user/${encodeURIComponent(user['.id'])}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      await fetchUsers()
      addToast({
        type: 'success',
        title: 'Usuário excluído!',
        description: `Usuário ${user.name} excluído com sucesso`
      })
    } catch (error) {
      console.error('[HotspotUsers] Error deleting user:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao excluir usuário: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }, [mikrotikId, baseUrl, headers, fetchUsers, addToast])

  // Handle toggle user status
  const handleToggleUserStatus = useCallback(async (user: EditingUser) => {
    try {
      const newDisabled = !(user.disabled === 'true' || user.disabled === true)
      
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user/${encodeURIComponent(user['.id'])}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          disabled: newDisabled ? 'yes' : 'no'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      await fetchUsers()
      addToast({
        type: 'success',
        title: 'Status alterado!',
        description: `Usuário ${user.name} ${newDisabled ? 'desativado' : 'ativado'} com sucesso`
      })
    } catch (error) {
      console.error('[HotspotUsers] Error toggling user status:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao alterar status: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
    }
  }, [mikrotikId, baseUrl, headers, fetchUsers, addToast])

  // Handle edit name
  const handleEditName = useCallback(async (user: EditingUser) => {
    if (!user.newName || user.newName === user.name) {
      setUsers(prev => prev.map(u => u['.id'] === user['.id'] ? { ...u, editingName: false, newName: u.name } : u))
      return
    }

    try {
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user/${encodeURIComponent(user['.id'])}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: user.newName
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      await fetchUsers()
      addToast({
        type: 'success',
        title: 'Nome alterado!',
        description: `Nome alterado de ${user.name} para ${user.newName}`
      })
    } catch (error) {
      console.error('[HotspotUsers] Error updating name:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao alterar nome: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
      setUsers(prev => prev.map(u => u['.id'] === user['.id'] ? { ...u, editingName: false, newName: u.name } : u))
    }
  }, [mikrotikId, baseUrl, headers, fetchUsers, addToast])

  // Handle edit password
  const handleEditPassword = useCallback(async (user: EditingUser) => {
    if (!user.newPassword) {
      setUsers(prev => prev.map(u => u['.id'] === user['.id'] ? { ...u, editingPassword: false, newPassword: '' } : u))
      return
    }

    try {
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user/${encodeURIComponent(user['.id'])}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          password: user.newPassword
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      await fetchUsers()
      addToast({
        type: 'success',
        title: 'Senha alterada!',
        description: `Senha do usuário ${user.name} alterada com sucesso`
      })
    } catch (error) {
      console.error('[HotspotUsers] Error updating password:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao alterar senha: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      })
      setUsers(prev => prev.map(u => u['.id'] === user['.id'] ? { ...u, editingPassword: false, newPassword: '' } : u))
    }
  }, [mikrotikId, baseUrl, headers, fetchUsers, addToast])

  // Filter and paginate users
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  )

  // Get user status
  const getUserStatus = (user: EditingUser) => {
    const disabled = user.disabled === 'true' || user.disabled === true
    return disabled ? 'Inativo' : 'Ativo'
  }

  // Get user status color
  const getUserStatusColor = (user: EditingUser) => {
    const disabled = user.disabled === 'true' || user.disabled === true
    return disabled ? 'destructive' : 'success'
  }

  // Format bytes
  const formatBytes = (bytes: string): string => {
    if (!bytes || bytes === '0') return '0 B'
    const numBytes = parseInt(bytes)
    if (numBytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(numBytes) / Math.log(k))

    return parseFloat((numBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-700/30 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-700/30 rounded w-32 animate-pulse"></div>
        </div>
        
        <Card className="bg-black/40 border-gray-800/50 overflow-hidden">
          {/* Header skeleton */}
          <div className="bg-gray-900/50 px-4 py-3 border-b border-gray-800/50">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-1 h-4 bg-gray-700/30 rounded animate-pulse"></div>
              <div className="col-span-3 h-4 bg-gray-700/30 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-700/30 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-700/30 rounded animate-pulse"></div>
              <div className="col-span-1 h-4 bg-gray-700/30 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-700/30 rounded animate-pulse"></div>
              <div className="col-span-1 h-4 bg-gray-700/30 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Body skeleton */}
          <div className="divide-y divide-gray-800/50">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="px-4 py-3 animate-pulse">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1 h-4 bg-gray-700/30 rounded"></div>
                  <div className="col-span-3 h-5 bg-gray-700/30 rounded"></div>
                  <div className="col-span-2 h-5 bg-gray-700/30 rounded"></div>
                  <div className="col-span-2 h-4 bg-gray-700/30 rounded"></div>
                  <div className="col-span-1 h-6 bg-gray-700/30 rounded"></div>
                  <div className="col-span-2 h-4 bg-gray-700/30 rounded"></div>
                  <div className="col-span-1 flex gap-1">
                    <div className="h-8 w-8 bg-gray-700/30 rounded"></div>
                    <div className="h-8 w-8 bg-gray-700/30 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Usuários Hotspot</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-400">
            <span>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}
            </span>
            {searchTerm && (
              <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                Filtrado por: "{searchTerm}"
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''} sm:mr-2`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          
          <Button
            onClick={() => setShowPrintModal(true)}
            variant="outline"
            size="sm"
            disabled={users.length === 0}
            className="flex-shrink-0"
            title="Imprimir usuários selecionados ou todos"
          >
            <Printer className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Imprimir</span>
            {selectedUsers.size > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedUsers.size}
              </Badge>
            )}
          </Button>
          
          <Button
            onClick={() => setShowBulkModal(true)}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <UserPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Gerar</span>
            <span className="hidden md:inline"> em Massa</span>
          </Button>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            size="sm"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo</span>
            <span className="hidden md:inline"> Usuário</span>
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, plano ou comentário..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10 bg-black/40 border-gray-800/50 text-white placeholder:text-gray-500"
          />
        </div>
        
        <div className="flex items-center gap-3">
          {selectedUsers.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUsers(new Set())}
              className="whitespace-nowrap"
            >
              {selectedUsers.size} selecionado{selectedUsers.size !== 1 ? 's' : ''} • Limpar
            </Button>
          )}
          
          <div className="text-sm text-gray-400 whitespace-nowrap">
            {filteredUsers.length} de {users.length}
          </div>
        </div>
      </div>

      {/* Users List */}
      {paginatedUsers.length === 0 ? (
        <Card className="bg-black/40 border-gray-800/50 p-6 sm:p-8 text-center">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário hotspot'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : 'Crie usuários hotspot para fornecer acesso à internet'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Usuário
            </Button>
          )}
        </Card>
      ) : (
        <Card className="bg-black/40 border-gray-800/50 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-900/50 px-4 py-3 border-b border-gray-800/50">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(new Set(paginatedUsers.map(u => u['.id'])))
                    } else {
                      setSelectedUsers(new Set())
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800/50 text-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="col-span-3">Usuário</div>
              <div className="col-span-2">Senha</div>
              <div className="col-span-2">Plano</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Estatísticas</div>
              <div className="col-span-1">Ações</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-800/50">
            {paginatedUsers.map((user, index) => (
              <motion.div
                key={user['.id']}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="px-4 py-3 hover:bg-gray-800/30 transition-colors duration-200"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Checkbox */}
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user['.id'])}
                      onChange={(e) => {
                        const newSelected = new Set(selectedUsers)
                        if (e.target.checked) {
                          newSelected.add(user['.id'])
                        } else {
                          newSelected.delete(user['.id'])
                        }
                        setSelectedUsers(newSelected)
                      }}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800/50 text-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Username */}
                  <div className="col-span-3">
                    {user.editingName ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={user.newName || ''}
                          onChange={(e) => setUsers(prev => prev.map(u => 
                            u['.id'] === user['.id'] ? { ...u, newName: e.target.value } : u
                          ))}
                          className="h-8 text-sm bg-gray-900/50 border-gray-700"
                          placeholder="Nome"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditName(user)}
                          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUsers(prev => prev.map(u => 
                            u['.id'] === user['.id'] ? { ...u, editingName: false, newName: u.name } : u
                          ))}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-lg">{user.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setUsers(prev => prev.map(u => 
                            u['.id'] === user['.id'] ? { ...u, editingName: true, newName: u.name } : u
                          ))}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        {user.comment && (
                          <span className="text-xs text-gray-500 italic truncate ml-2">({user.comment})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="col-span-2">
                    {user.editingPassword ? (
                      <div className="flex items-center gap-1">
                        <div className="relative flex-1">
                          <Input
                            type={user.showPassword ? 'text' : 'password'}
                            value={user.newPassword || ''}
                            onChange={(e) => setUsers(prev => prev.map(u => 
                              u['.id'] === user['.id'] ? { ...u, newPassword: e.target.value } : u
                            ))}
                            className="h-8 text-sm bg-gray-900/50 border-gray-700 pr-8"
                            placeholder="Nova senha"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setUsers(prev => prev.map(u => 
                              u['.id'] === user['.id'] ? { ...u, showPassword: !u.showPassword } : u
                            ))}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400"
                          >
                            {user.showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleEditPassword(user)}
                          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUsers(prev => prev.map(u => 
                            u['.id'] === user['.id'] ? { ...u, editingPassword: false, newPassword: '' } : u
                          ))}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <code className="text-blue-300 font-bold text-base bg-blue-950/30 px-2 py-1 rounded border border-blue-800/30">
                          {user.password || '••••••••'}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setUsers(prev => prev.map(u => 
                            u['.id'] === user['.id'] ? { ...u, editingPassword: true, newPassword: '' } : u
                          ))}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Plan */}
                  <div className="col-span-2">
                    {user.profile ? (
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-green-400" />
                        <span className="text-green-300 font-semibold">{user.profile}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Sem plano</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <Badge 
                      variant={getUserStatusColor(user) as any}
                      className="text-xs px-2 py-1"
                    >
                      {getUserStatus(user)}
                    </Badge>
                  </div>

                  {/* Statistics */}
                  <div className="col-span-2">
                    <div className="flex flex-col gap-1 text-xs">
                      {(user['bytes-in'] && parseInt(user['bytes-in']) > 0) || (user['bytes-out'] && parseInt(user['bytes-out']) > 0) ? (
                        <div className="flex items-center gap-2">
                          {user['bytes-in'] && parseInt(user['bytes-in']) > 0 && (
                            <span className="text-green-400">↓ {formatBytes(user['bytes-in'])}</span>
                          )}
                          {user['bytes-out'] && parseInt(user['bytes-out']) > 0 && (
                            <span className="text-blue-400">↑ {formatBytes(user['bytes-out'])}</span>
                          )}
                        </div>
                      ) : null}
                      {user.uptime && user.uptime !== '0s' && (
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-yellow-400" />
                          <span className="text-yellow-400">{user.uptime}</span>
                        </div>
                      )}
                      {(!user['bytes-in'] || parseInt(user['bytes-in']) === 0) && 
                       (!user['bytes-out'] || parseInt(user['bytes-out']) === 0) && 
                       (!user.uptime || user.uptime === '0s') && (
                        <span className="text-gray-500">Sem dados</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleUserStatus(user)}
                        className={`h-8 w-8 p-0 ${
                          getUserStatus(user) === 'Ativo' 
                            ? 'text-orange-400 hover:bg-orange-600/10 border-orange-500/30' 
                            : 'text-green-400 hover:bg-green-600/10 border-green-500/30'
                        }`}
                        title={getUserStatus(user) === 'Ativo' ? 'Desativar usuário' : 'Ativar usuário'}
                      >
                        {getUserStatus(user) === 'Ativo' ? (
                          <PowerOff className="h-3 w-3" />
                        ) : (
                          <Power className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user)}
                        className="h-8 w-8 p-0 border-red-600/30 text-red-400 hover:bg-red-600/10"
                        title="Excluir usuário"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 order-2 sm:order-1">
            Página {currentPage} de {totalPages} • {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
          </p>
          
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Anterior</span>
            </Button>
            
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span>{currentPage}</span>
              <span>/</span>
              <span>{totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline mr-1">Próxima</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        profiles={profiles}
      />

      <BulkGenerateModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSubmit={handleBulkGenerate}
        profiles={profiles}
      />

      <PrintUsersModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        users={users.filter(user => selectedUsers.has(user['.id']))}
        allUsers={users}
        profiles={profiles}
      />
    </div>
  )
}

export default HotspotUsersNew