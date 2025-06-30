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
  X,
  Key,
  ArrowLeft,
  Download,
  Eye,
  Copy,
  CheckCircle,
  Printer
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  generatePasswordBatch, 
  formatGenerationSummary,
  generatePreviewData,
  estimateCreationTime,
  formatEstimatedTime,
  PASSWORD_GENERATION_LIMITS,
  type PasswordGenerationConfig,
  type GeneratedUser
} from '../../utils/passwordGenerator'

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
  onGeneratePasswords?: (users: GeneratedUser[]) => Promise<void>
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
  
  // Password Generation States
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false)
  const [generationConfig, setGenerationConfig] = useState<PasswordGenerationConfig>({
    quantity: 10,
    profile: profiles[0]?.name || 'default'
  })
  const [generatedUsers, setGeneratedUsers] = useState<GeneratedUser[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState<'config' | 'preview' | 'generating' | 'completed'>('config')
  
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

  // Password Generation Function
  const handlePasswordGeneration = async () => {
    if (!onGeneratePasswords) return
    
    try {
      setIsGenerating(true)
      setGenerationStep('generating')
      setGenerationProgress(0)
      
      // Gerar usuários
      const existingUsernames = users.map(u => u.name)
      const result = generatePasswordBatch(generationConfig, existingUsernames)
      
      if (result.errors.length > 0) {
        console.warn('Erros na geração:', result.errors)
      }
      
      setGeneratedUsers(result.users)
      
      // Simular progresso da criação
      const totalUsers = result.users.length
      let progress = 0
      
      const updateProgress = () => {
        progress += Math.random() * 15 + 5 // 5-20% por vez
        setGenerationProgress(Math.min(progress, 90))
      }
      
      const progressInterval = setInterval(updateProgress, 200)
      
      // Criar usuários no MikroTik
      await onGeneratePasswords(result.users)
      
      // Finalizar progresso
      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGenerationStep('completed')
      
    } catch (error) {
      console.error('Erro na geração de senhas:', error)
      setGenerationStep('config')
    } finally {
      setIsGenerating(false)
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
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={onCreateUser} 
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
          {onGeneratePasswords && (
            <>
              <Button 
                onClick={() => setShowPasswordGenerator(true)} 
                className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-none"
              >
                <Key className="h-4 w-4 mr-2" />
                Gerar Senhas
              </Button>
              {onPrintPasswords && (
                <Button 
                  onClick={onPrintPasswords} 
                  className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              )}
            </>
          )}
        </div>
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

      {/* Password Generator Modal */}
      <AnimatePresence>
        {showPasswordGenerator && (
          <PasswordGeneratorModal
            profiles={profiles}
            existingUsers={users}
            config={generationConfig}
            onConfigChange={setGenerationConfig}
            onGenerate={handlePasswordGeneration}
            onClose={() => {
              setShowPasswordGenerator(false)
              setGenerationStep('config')
              setGeneratedUsers([])
              setGenerationProgress(0)
            }}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            generationStep={generationStep}
            generatedUsers={generatedUsers}
          />
        )}
      </AnimatePresence>

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

// Componente do Modal de Geração de Senhas
interface PasswordGeneratorModalProps {
  profiles: HotspotProfile[]
  existingUsers: HotspotUser[]
  config: PasswordGenerationConfig
  onConfigChange: (config: PasswordGenerationConfig) => void
  onGenerate: () => void
  onClose: () => void
  isGenerating: boolean
  generationProgress: number
  generationStep: 'config' | 'preview' | 'generating' | 'completed'
  generatedUsers: GeneratedUser[]
}

const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  profiles,
  existingUsers,
  config,
  onConfigChange,
  onGenerate,
  onClose,
  isGenerating,
  generationProgress,
  generationStep,
  generatedUsers
}) => {
  const [previewUsers, setPreviewUsers] = useState<GeneratedUser[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const estimatedTime = estimateCreationTime(config.quantity)
  
  // Gerar preview quando configuração muda
  React.useEffect(() => {
    if (config.profile && config.quantity > 0) {
      const preview = generatePreviewData(config.profile, 3)
      setPreviewUsers(preview)
    }
  }, [config])
  
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !isGenerating && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-black border border-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Key className="h-6 w-6 text-purple-400" />
              Gerador de Senhas
            </h2>
            <p className="text-gray-400 mt-1">
              Gere usuários em lote com senhas numéricas de 5 dígitos
            </p>
          </div>
          {!isGenerating && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { key: 'config', label: 'Configuração', icon: Key },
              { key: 'generating', label: 'Gerando', icon: Download },
              { key: 'completed', label: 'Concluído', icon: CheckCircle }
            ].map((step, index) => {
              const isActive = generationStep === step.key
              const isCompleted = 
                (step.key === 'config' && ['generating', 'completed'].includes(generationStep)) ||
                (step.key === 'generating' && generationStep === 'completed')
              
              return (
                <React.Fragment key={step.key}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive ? 'bg-purple-600 text-white' :
                    isCompleted ? 'bg-green-600 text-white' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    <step.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {generationStep === 'config' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Configuration Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quantidade de Usuários
                  </label>
                  <Input
                    type="number"
                    min={PASSWORD_GENERATION_LIMITS.MIN_QUANTITY}
                    max={PASSWORD_GENERATION_LIMITS.MAX_QUANTITY}
                    value={config.quantity}
                    onChange={(e) => onConfigChange({
                      ...config,
                      quantity: Math.min(PASSWORD_GENERATION_LIMITS.MAX_QUANTITY, Math.max(1, parseInt(e.target.value) || 1))
                    })}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: {PASSWORD_GENERATION_LIMITS.MAX_QUANTITY} usuários por vez
                  </p>
                </div>

                {/* Profile */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Perfil/Plano
                  </label>
                  <select
                    value={config.profile}
                    onChange={(e) => onConfigChange({ ...config, profile: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  >
                    {profiles.map(profile => (
                      <option key={profile['.id']} value={profile.name}>
                        {profile.name} {profile['rate-limit'] && `(${profile['rate-limit']})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Preview dos Usuários</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {previewUsers.map((user, index) => (
                    <div key={index} className="bg-black border border-gray-800 rounded-lg p-3">
                      <div className="text-sm">
                        <div className="text-purple-400 font-mono">{user.username}</div>
                        <div className="text-gray-400">Senha: {user.password}</div>
                        <div className="text-gray-500 text-xs">{user.profile}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  Usuários serão criados com códigos únicos de 5 dígitos
                </div>
              </div>

              {/* Estimation */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-blue-400 font-semibold">
                      Tempo estimado: {formatEstimatedTime(estimatedTime)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Para criar {config.quantity} usuários no MikroTik
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-xl">{config.quantity}</div>
                    <div className="text-gray-400 text-sm">usuários</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={onGenerate}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={config.quantity < 1 || !config.profile}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Começar a Gerar
                </Button>
              </div>
            </motion.div>
          )}

          {generationStep === 'generating' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full border-4 border-purple-500/20 border-t-purple-500 rounded-full"
                />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Gerando Usuários...</h3>
                <p className="text-gray-400">Criando {config.quantity} usuários no MikroTik</p>
              </div>
              
              <div className="w-full max-w-md mx-auto">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progresso</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="bg-purple-500 h-2 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {generationStep === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Success Message */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Usuários Gerados com Sucesso!</h3>
                <p className="text-gray-400">
                  {generatedUsers.length} usuários foram criados no MikroTik
                </p>
              </div>

              {/* Generation Statistics */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="mb-3">
                  <h4 className="font-semibold text-white">Estatísticas da Geração</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-black border border-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{generatedUsers.length}</div>
                    <div className="text-sm text-gray-400">Usuários Criados</div>
                  </div>
                  <div className="bg-black border border-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{config.profile}</div>
                    <div className="text-sm text-gray-400">Perfil Utilizado</div>
                  </div>
                  <div className="bg-black border border-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">100%</div>
                    <div className="text-sm text-gray-400">Taxa de Sucesso</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center">
                <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
                  Concluir
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default HotspotUsersTab