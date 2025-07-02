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
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Key,
  Users,
  Printer
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  onGeneratePasswords?: () => void
  onPrintPasswords?: () => void
  loading?: boolean
}

const HotspotUsersTab: React.FC<HotspotUsersTabProps> = ({
  users,
  profiles = [],
  onCreateUser,
  onEditUser,
  onDeleteUser,
  onToggleUser,
  onGeneratePasswords,
  onPrintPasswords,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProfile, setSelectedProfile] = useState<string>('all')
  const [showDisabledOnly, setShowDisabledOnly] = useState(false)
  const [commentFilter, setCommentFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const usersPerPage = 25

  // Helper function to check if user is active
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

  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profile && user.profile.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.comment && user.comment.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesProfile = selectedProfile === 'all' || user.profile === selectedProfile
    const matchesDisabledFilter = !showDisabledOnly || !getIsUserActive(user)
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
    const profilesSet = new Set((Array.isArray(users) ? users : []).map(user => user.profile).filter(Boolean))
    return Array.from(profilesSet).sort()
  }, [users])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Usuários do Hotspot</h2>
          <p className="text-gray-400 text-sm">
            {paginatedData.totalUsers} {paginatedData.totalUsers === 1 ? 'usuário encontrado' : 'usuários encontrados'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            onClick={onCreateUser}
            className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Novo Usuário</span>
          </Button>
          
          {onGeneratePasswords && (
            <Button 
              onClick={onGeneratePasswords}
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-600/20 flex-1 sm:flex-none"
            >
              <Key className="h-4 w-4 mr-2" />
              <span>Gerar Senhas</span>
            </Button>
          )}

          {onPrintPasswords && (
            <Button 
              onClick={onPrintPasswords}
              variant="outline"
              className="border-purple-600 text-purple-400 hover:bg-purple-600/20 flex-1 sm:flex-none"
            >
              <Printer className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 sm:p-6 border-gray-800">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar usuários, perfis ou comentários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gray-700 text-gray-300"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>

            {(selectedProfile !== 'all' || showDisabledOnly || commentFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProfile('all')
                  setShowDisabledOnly(false)
                  setCommentFilter('')
                }}
                className="border-red-600 text-red-400 hover:bg-red-600/20"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-700"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Perfil</label>
                  <select
                    value={selectedProfile}
                    onChange={(e) => setSelectedProfile(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-md focus:border-blue-500"
                  >
                    <option value="all">Todos os perfis</option>
                    {uniqueProfiles.map(profile => (
                      <option key={profile} value={profile}>{formatProfileName(profile)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <div className="flex items-center space-x-2 h-10">
                    <input
                      type="checkbox"
                      id="showDisabled"
                      checked={showDisabledOnly}
                      onChange={(e) => setShowDisabledOnly(e.target.checked)}
                      className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="showDisabled" className="text-sm text-gray-300">
                      Apenas desabilitados
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Comentário</label>
                  <Input
                    placeholder="Filtrar por comentário..."
                    value={commentFilter}
                    onChange={(e) => setCommentFilter(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-800">
              <tr>
                <th className="text-left p-3 sm:p-4 text-gray-300 font-medium text-sm">Usuário</th>
                <th className="text-left p-3 sm:p-4 text-gray-300 font-medium text-sm hidden sm:table-cell">Senha</th>
                <th className="text-left p-3 sm:p-4 text-gray-300 font-medium text-sm">Perfil</th>
                <th className="text-left p-3 sm:p-4 text-gray-300 font-medium text-sm hidden md:table-cell">Comentário</th>
                <th className="text-left p-3 sm:p-4 text-gray-300 font-medium text-sm">Status</th>
                <th className="text-right p-3 sm:p-4 text-gray-300 font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginatedData.users.map((user, index) => (
                  <motion.tr
                    key={user['.id']}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="p-3 sm:p-4">
                      <div className="text-white font-mono text-sm">{user.name}</div>
                    </td>
                    <td className="p-3 sm:p-4 hidden sm:table-cell">
                      <div className="text-gray-400 font-mono text-sm">
                        {user.password ? '●●●●●●●●' : 'N/A'}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-600/30">
                        {formatProfileName(user.profile)}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 hidden md:table-cell">
                      <div className="text-gray-400 text-sm max-w-32 truncate">
                        {user.comment || '-'}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        {getIsUserActive(user) ? (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-400 text-sm">Ativo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-red-400 text-sm">Inativo</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleUser(user)}
                          className="h-8 w-8 p-0 border-gray-700 hover:border-yellow-500/50 hover:bg-yellow-500/10"
                        >
                          {getIsUserActive(user) ? (
                            <PowerOff className="h-3 w-3 text-yellow-400" />
                          ) : (
                            <Power className="h-3 w-3 text-green-400" />
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditUser(user)}
                          className="h-8 w-8 p-0 border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/10"
                        >
                          <Edit className="h-3 w-3 text-blue-400" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteUser(user)}
                          className="h-8 w-8 p-0 border-gray-700 hover:border-red-500/50 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginatedData.totalPages > 1 && (
          <div className="border-t border-gray-800 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                Mostrando {paginatedData.startIndex} - {paginatedData.endIndex} de {paginatedData.totalUsers} usuários
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, paginatedData.totalPages) }).map((_, i) => {
                    const pageNumber = i + 1
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={currentPage === pageNumber 
                          ? "bg-blue-600 hover:bg-blue-700" 
                          : "border-gray-700"
                        }
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(paginatedData.totalPages, currentPage + 1))}
                  disabled={currentPage === paginatedData.totalPages}
                  className="border-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Empty State */}
      {paginatedData.users.length === 0 && !loading && (
        <Card className="border-gray-800 p-8 sm:p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchTerm || selectedProfile !== 'all' || showDisabledOnly || commentFilter
                ? 'Nenhum usuário encontrado'
                : 'Nenhum usuário cadastrado'
              }
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || selectedProfile !== 'all' || showDisabledOnly || commentFilter
                ? 'Tente ajustar os filtros de pesquisa ou criar um novo usuário.'
                : 'Comece criando seu primeiro usuário do hotspot.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onCreateUser} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Usuário
              </Button>
              {onGeneratePasswords && (
                <Button 
                  onClick={onGeneratePasswords}
                  variant="outline"
                  className="border-green-600 text-green-400 hover:bg-green-600/20"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Gerar Senhas em Lote
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default HotspotUsersTab
