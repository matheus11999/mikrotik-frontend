import React, { useState, useMemo } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react'

interface HotspotUser {
  '.id': string
  name: string
  password?: string
  profile?: string
  comment?: string
  disabled?: boolean
}

interface HotspotProfile {
  '.id': string
  name: string
  'rate-limit'?: string
  valor?: number
}

interface HotspotUsersTabProps {
  users: HotspotUser[]
  profiles?: HotspotProfile[]
  onCreateUser: () => void
  onEditUser: (user: HotspotUser) => void
  onDeleteUser: (user: HotspotUser) => void
  onToggleUser: (user: HotspotUser) => void
  loading?: boolean
}

const HotspotUsersTab: React.FC<HotspotUsersTabProps> = ({
  users,
  profiles = [],
  onCreateUser,
  onEditUser,
  onDeleteUser,
  onToggleUser,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProfile, setSelectedProfile] = useState<string>('all')
  const [showDisabledOnly, setShowDisabledOnly] = useState(false)
  const [commentFilter, setCommentFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const usersPerPage = 25

  // Helper function to check if user is active (handles string and boolean values)
  const getIsUserActive = (user: HotspotUser) => {
    if (typeof user.disabled === 'string') {
      return user.disabled !== 'true' && user.disabled !== 'yes'
    }
    return !user.disabled
  }

  // Helper function to format profile name
  const formatProfileName = (profile: string | undefined) => {
    if (!profile || profile === 'default') {
      return 'Padrão'
    }
    if (profile === 'default-trial') {
      return 'Teste (Trial)'
    }
    return profile
  }

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profile && user.profile.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.comment && user.comment.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Profile filter
    const matchesProfile = selectedProfile === 'all' || user.profile === selectedProfile
    
    // Disabled filter
    const matchesDisabledFilter = !showDisabledOnly || !getIsUserActive(user)
    
    // Comment filter
    const matchesCommentFilter = !commentFilter || 
      (user.comment && user.comment.toLowerCase().includes(commentFilter.toLowerCase()))
    
    return matchesSearch && matchesProfile && matchesDisabledFilter && matchesCommentFilter
  })

  // Pagination logic
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
    const startIndex = (currentPage - 1) * usersPerPage
    const endIndex = startIndex + usersPerPage
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)
    
    return {
      users: paginatedUsers,
      totalPages,
      totalUsers: filteredUsers.length,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, filteredUsers.length)
    }
  }, [filteredUsers, currentPage, usersPerPage])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedProfile, showDisabledOnly, commentFilter])

  // Get unique profiles for filter dropdown
  const uniqueProfiles = React.useMemo(() => {
    const profilesSet = new Set(users.map(user => user.profile).filter(Boolean))
    return Array.from(profilesSet).sort()
  }, [users])

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
          <h2 className="text-xl sm:text-2xl font-bold text-white">Usuários Hotspot</h2>
          <p className="text-sm text-gray-400 mt-1">
            {paginatedData.totalUsers > 0 && (
              <>
                Mostrando {paginatedData.startIndex}-{paginatedData.endIndex} de {paginatedData.totalUsers} usuários
                {searchTerm && ` encontrados`}
              </>
            )}
            {paginatedData.totalUsers === 0 && (
              searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'
            )}
          </p>
        </div>
        <Button 
          onClick={onCreateUser} 
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar usuários por nome, perfil ou comentário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 sm:py-4 bg-black border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-base sm:text-lg"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Profile Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filtrar por Perfil
                </label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-gray-700 text-white rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Todos os perfis</option>
                  {uniqueProfiles.map(profile => (
                    <option key={profile} value={profile}>
                      {formatProfileName(profile)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showDisabled"
                    checked={showDisabledOnly}
                    onChange={(e) => setShowDisabledOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="showDisabled" className="text-sm text-gray-300">
                    Apenas usuários desativados
                  </label>
                </div>
              </div>

              {/* Comment Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buscar em Comentários
                </label>
                <Input
                  placeholder="Buscar comentários..."
                  value={commentFilter}
                  onChange={(e) => setCommentFilter(e.target.value)}
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedProfile !== 'all' || showDisabledOnly || commentFilter) && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProfile('all')
                    setShowDisabledOnly(false)
                    setCommentFilter('')
                  }}
                  className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {paginatedData.users.length === 0 ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="text-center max-w-md px-4">
              <div className="relative mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <Plus className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </h3>
              <p className="text-gray-400 mb-8 text-base sm:text-lg">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca para encontrar o que procura'
                  : 'Comece criando seu primeiro usuário para o hotspot'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={onCreateUser} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium shadow-lg transition-all duration-300 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Criar Primeiro Usuário
                </Button>
              )}
            </div>
          </div>
        ) : (
          paginatedData.users.map(user => (
            <Card key={user['.id']} className="bg-black border border-gray-800 hover:border-blue-500 hover:bg-gray-900/50 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${getIsUserActive(user) ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{user.name}</h3>
                      {user.comment && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400" title={user.comment}>
                            Comentário
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">
                        Perfil: <span className="text-blue-400">{formatProfileName(user.profile)}</span>
                      </p>
                      {user.comment && (
                        <p className="text-xs text-gray-500 bg-gray-800 rounded px-2 py-1 inline-block">
                          {user.comment}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Status: <span className={getIsUserActive(user) ? 'text-green-400' : 'text-red-400'}>
                          {getIsUserActive(user) ? 'Ativo' : 'Inativo'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Toggle Status */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onToggleUser(user)}
                    className={`${!getIsUserActive(user)
                      ? 'border-green-600/50 text-green-400 hover:text-green-300 hover:bg-green-600/10' 
                      : 'border-orange-600/50 text-orange-400 hover:text-orange-300 hover:bg-orange-600/10'
                    }`}
                    title={!getIsUserActive(user) ? 'Ativar usuário' : 'Desativar usuário'}
                  >
                    {!getIsUserActive(user) ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  </Button>

                  {/* Edit */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEditUser(user)}
                    className="border-blue-600/50 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
                    title="Editar usuário"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Delete */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDeleteUser(user)}
                    className="border-red-600/50 text-red-400 hover:text-red-300 hover:bg-red-600/10"
                    title="Excluir usuário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {paginatedData.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-400">
            Página {currentPage} de {paginatedData.totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                let pageNum
                if (paginatedData.totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= paginatedData.totalPages - 2) {
                  pageNum = paginatedData.totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                    }
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginatedData.totalPages))}
              disabled={currentPage === paginatedData.totalPages}
              className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HotspotUsersTab