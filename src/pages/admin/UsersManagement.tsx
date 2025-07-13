import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useToast } from '../../components/ui/toast'
import { Badge } from '../../components/ui/badge'
import { 
  Users, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  DollarSign,
  Router,
  Shield,
  AlertCircle,
  UserCog,
  RefreshCw,
  CreditCard,
  Filter,
  Download,
  UserPlus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'

interface User {
  id: string
  email: string
  nome: string
  role: 'admin' | 'user'
  saldo: number
  telefone?: string
  cpf?: string
  pix_key?: string
  created_at: string
  updated_at: string
  mikrotiks?: MikroTik[]
}

interface MikroTik {
  id: string
  nome: string
  ip?: string
  status?: string
  created_at: string
}

export function UsersManagement() {
  const { user, session } = useAuthContext()
  const { addToast } = useToast()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [createMikrotikModalOpen, setCreateMikrotikModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNote, setCreditNote] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    pix_key: '',
    role: 'user' as 'admin' | 'user',
    saldo: 0
  })

  const [mikrotikFormData, setMikrotikFormData] = useState({
    nome: '',
    ip: '',
    username: '',
    password: '',
    porta: 8728
  })

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
    }
  }, [user])

  // Scroll detection for blur effect
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20
      setIsScrolled(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      console.log('Fetching users directly from Supabase:', user?.role)
      
      // Buscar usuários diretamente do Supabase (RLS desabilitado)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Users query result:', { usersData, usersError })

      if (usersError) throw usersError

      // Buscar mikrotiks para cada usuário
      const usersWithMikrotiks = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: mikrotiksData, error: mikrotiksError } = await supabase
            .from('mikrotiks')
            .select('id, nome, ip, ativo, created_at')
            .eq('user_id', user.id)

          if (mikrotiksError) {
            console.warn('Error fetching mikrotiks for user:', user.id, mikrotiksError)
            return { ...user, mikrotiks: [] }
          }

          return { ...user, mikrotiks: mikrotiksData || [] }
        })
      )

      setUsers(usersWithMikrotiks)
    } catch (error) {
      console.error('Error fetching users:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao carregar usuários'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      // Gerar ID único para o usuário
      const userId = crypto.randomUUID()

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: formData.email,
          nome: formData.nome,
          telefone: formData.telefone,
          cpf: formData.cpf,
          pix_key: formData.pix_key,
          role: formData.role,
          saldo: formData.saldo,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: `Usuário ${formData.nome} criado com sucesso`
      })
      
      setCreateUserModalOpen(false)
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        pix_key: '',
        role: 'user',
        saldo: 0
      })
      fetchUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: error.message || 'Erro ao criar usuário'
      })
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          cpf: formData.cpf,
          pix_key: formData.pix_key,
          role: formData.role,
          saldo: formData.saldo
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'Usuário atualizado com sucesso'
      })
      
      setEditModalOpen(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Error updating user:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao atualizar usuário'
      })
    }
  }

  const handleCreditBalance = async () => {
    if (!selectedUser || !creditAmount) return

    try {
      const amount = parseFloat(creditAmount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Valor inválido')
      }

      // Update user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          saldo: selectedUser.saldo + amount
        })
        .eq('id', selectedUser.id)

      if (updateError) throw updateError

      // Log the transaction
      const { error: logError } = await supabase
        .from('transacoes')
        .insert({
          user_id: selectedUser.id,
          tipo: 'credito_admin',
          valor: amount,
          descricao: creditNote || `Crédito manual - Admin: ${user?.nome}`,
          status: 'aprovada'
        })

      if (logError) throw logError

      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: `R$ ${amount.toFixed(2)} creditado para ${selectedUser.nome}`
      })
      
      setCreditModalOpen(false)
      setCreditAmount('')
      setCreditNote('')
      fetchUsers()
    } catch (error: any) {
      console.error('Error crediting balance:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: error.message || 'Erro ao creditar saldo'
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id)
      
      if (error) throw error

      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'Usuário deletado com sucesso'
      })
      
      setDeleteModalOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Erro ao deletar usuário'
      })
    }
  }

  const openEditModal = (userData: User) => {
    setSelectedUser(userData)
    setFormData({
      nome: userData.nome,
      email: userData.email,
      telefone: userData.telefone || '',
      cpf: userData.cpf || '',
      pix_key: userData.pix_key || '',
      role: userData.role,
      saldo: userData.saldo
    })
    setEditModalOpen(true)
  }

  const openCreditModal = (userData: User) => {
    setSelectedUser(userData)
    setCreditAmount('')
    setCreditNote('')
    setCreditModalOpen(true)
  }

  const filteredUsers = users.filter(userData => {
    const matchesSearch = !searchTerm || (
      userData.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.telefone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.cpf?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    const matchesRole = roleFilter === 'all' || userData.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const totalUsers = users.length
  const adminUsers = users.filter(u => u.role === 'admin').length
  const regularUsers = users.filter(u => u.role === 'user').length
  const totalBalance = users.reduce((sum, u) => sum + (u.saldo || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-16 lg:pt-0 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full mx-auto mb-6"
          />
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2"
          >
            Carregando usuários...
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400"
          >
            Aguarde um momento
          </motion.p>
        </motion.div>
      </div>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black pt-16 lg:pt-0 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 flex items-center justify-center backdrop-blur-sm"
          >
            <AlertCircle className="h-12 w-12 text-red-400" />
          </motion.div>
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4"
          >
            Acesso Negado
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 text-lg"
          >
            Apenas administradores podem acessar esta página.
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-black pt-16 lg:pt-0">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border-b px-4 sm:px-6 py-6 sticky top-0 lg:top-0 z-40 transition-all duration-500 ${
            isScrolled 
              ? 'bg-black/60 backdrop-blur-xl border-gray-700/30 shadow-2xl' 
              : 'bg-black/40 backdrop-blur-sm border-gray-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20"
                >
                  <Users className="h-6 w-6 text-blue-400" />
                </motion.div>
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                  >
                    Gerenciamento de Usuários
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-400"
                  >
                    Gerencie usuários, saldos e permissões
                  </motion.p>
                </div>
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCreateUserModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-500/90 hover:to-blue-600/90 text-white rounded-xl border border-blue-500/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="font-medium">Novo Usuário</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchUsers}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/80 to-purple-700/80 hover:from-purple-500/90 hover:to-purple-600/90 disabled:from-gray-700/60 disabled:to-gray-800/60 text-white rounded-xl border border-purple-500/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="font-medium">Atualizar</span>
                </motion.button>
              </motion.div>
            </div>
        </motion.div>

        <div className="p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6 sm:space-y-8"
          >

            {/* Stats Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-1">Total de Usuários</p>
                    <p className="text-3xl font-bold text-white">{totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-400 mb-1">Administradores</p>
                    <p className="text-3xl font-bold text-white">{adminUsers}</p>
                  </div>
                  <UserCog className="w-8 h-8 text-purple-400" />
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-400 mb-1">Usuários Regulares</p>
                    <p className="text-3xl font-bold text-white">{regularUsers}</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-400 mb-1">Saldo Total</p>
                    <p className="text-3xl font-bold text-white">R$ {totalBalance.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-400" />
                </div>
              </motion.div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email, telefone ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-black/40 backdrop-blur-sm border-gray-800/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                />
              </div>
              
              {/* Role Filters */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-2"
              >
                {[
                  { key: 'all', label: `Todos (${totalUsers})`, color: 'blue' },
                  { key: 'admin', label: `Admins (${adminUsers})`, color: 'purple' },
                  { key: 'user', label: `Usuários (${regularUsers})`, color: 'green' }
                ].map((filter, index) => (
                  <motion.div
                    key={filter.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setRoleFilter(filter.key as any)}
                      variant={roleFilter === filter.key ? 'default' : 'outline'}
                      size="sm"
                      className={`h-9 text-xs transition-all duration-200 ${
                        roleFilter === filter.key
                          ? `bg-${filter.color}-600 hover:bg-${filter.color}-700 text-white shadow-lg`
                          : 'border-gray-700 text-gray-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10'
                      }`}
                    >
                      {filter.label}
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Users Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredUsers.map((userData, index) => (
                  <motion.div
                    key={userData.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="bg-black/80 backdrop-blur-sm border border-gray-800/50 hover:border-blue-500/50 hover:bg-gray-900/30 rounded-2xl transition-all duration-300 p-6"
                  >
                    {/* User Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                          {userData.role === 'admin' ? (
                            <UserCog className="w-6 h-6 text-purple-400" />
                          ) : (
                            <Users className="w-6 h-6 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{userData.nome}</h3>
                          <p className="text-sm text-gray-400">{userData.email}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={userData.role === 'admin' ? 'destructive' : 'secondary'}
                        className={userData.role === 'admin' ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' : 'bg-blue-600/20 text-blue-400 border-blue-500/30'}
                      >
                        {userData.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
                    </div>

                    {/* User Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Saldo:</span>
                        <span className={`font-semibold ${userData.saldo > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                          R$ {userData.saldo.toFixed(2)}
                        </span>
                      </div>
                      
                      {userData.telefone && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Telefone:</span>
                          <span className="text-white text-sm">{userData.telefone}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">MikroTiks:</span>
                        <span className="text-white text-sm">{userData.mikrotiks?.length || 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Criado:</span>
                        <span className="text-white text-sm">
                          {new Date(userData.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(userData)
                            setViewModalOpen(true)
                          }}
                          className="border-gray-600 text-gray-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(userData)}
                          className="border-purple-600 text-purple-400 hover:text-purple-300 hover:border-purple-500/50 hover:bg-purple-500/10 flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCreditModal(userData)}
                          className="border-green-600 text-green-400 hover:text-green-300 hover:border-green-500/50 hover:bg-green-500/10 flex-1"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Creditar
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredUsers.length === 0 && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center backdrop-blur-sm">
                  <Users className="h-12 w-12 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-400 text-lg">
                  Tente ajustar os filtros de busca
                </p>
              </motion.div>
            )}

          </motion.div>
        </div>
      </div>

      {/* View User Modal */}
      <Dialog.Root open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50 p-6">
            {selectedUser && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold text-white flex items-center">
                    <Users className="w-6 h-6 text-blue-400 mr-2" />
                    Detalhes do Usuário
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-gray-800 text-gray-400 hover:text-white">
                      ✕
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
                      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                        <p className="text-white">{selectedUser.nome}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                        <p className="text-white">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                        <Badge variant={selectedUser.role === 'admin' ? 'destructive' : 'secondary'}>
                          {selectedUser.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Saldo</label>
                      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                        <p className={`font-semibold ${selectedUser.saldo > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                          R$ {selectedUser.saldo.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {selectedUser.telefone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Telefone</label>
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                          <p className="text-white">{selectedUser.telefone}</p>
                        </div>
                      </div>
                    )}
                    {selectedUser.cpf && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">CPF</label>
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                          <p className="text-white">{selectedUser.cpf}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* MikroTiks */}
                  {selectedUser.mikrotiks && selectedUser.mikrotiks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Router className="w-5 h-5 text-blue-400 mr-2" />
                        MikroTiks ({selectedUser.mikrotiks.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedUser.mikrotiks.map((mikrotik) => (
                          <div key={mikrotik.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-white font-medium">{mikrotik.nome}</p>
                                <p className="text-gray-400 text-sm">{mikrotik.ip || 'IP não configurado'}</p>
                              </div>
                              <Badge variant="secondary">
                                {mikrotik.status || 'Inativo'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Create User Modal */}
      <Dialog.Root open={createUserModalOpen} onOpenChange={setCreateUserModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border border-gray-800 rounded-xl shadow-2xl w-full max-w-md z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold text-white flex items-center">
                <UserPlus className="w-6 h-6 text-blue-400 mr-2" />
                Criar Usuário
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" className="hover:bg-gray-800 text-gray-400 hover:text-white">
                  ✕
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-gray-900 border-gray-800 text-white"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-gray-900 border-gray-800 text-white"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Telefone</label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="bg-gray-900 border-gray-800 text-white"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg p-3"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Saldo Inicial</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.saldo}
                  onChange={(e) => setFormData({ ...formData, saldo: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-900 border-gray-800 text-white"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Dialog.Close asChild>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                  >
                    Cancelar
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={handleCreateUser}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Usuário
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit User Modal */}
      <Dialog.Root open={editModalOpen} onOpenChange={setEditModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border border-gray-800 rounded-xl shadow-2xl w-full max-w-md z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold text-white flex items-center">
                <Edit className="w-6 h-6 text-purple-400 mr-2" />
                Editar Usuário
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" className="hover:bg-gray-800 text-gray-400 hover:text-white">
                  ✕
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Telefone</label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">CPF</label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Chave PIX</label>
                <Input
                  value={formData.pix_key}
                  onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg p-3"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Saldo</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.saldo}
                  onChange={(e) => setFormData({ ...formData, saldo: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Dialog.Close asChild>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                  >
                    Cancelar
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={handleUpdateUser}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Credit Balance Modal */}
      <Dialog.Root open={creditModalOpen} onOpenChange={setCreditModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border border-gray-800 rounded-xl shadow-2xl w-full max-w-md z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold text-white flex items-center">
                <CreditCard className="w-6 h-6 text-green-400 mr-2" />
                Creditar Saldo
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" className="hover:bg-gray-800 text-gray-400 hover:text-white">
                  ✕
                </Button>
              </Dialog.Close>
            </div>

            {selectedUser && (
              <div className="space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <p className="text-white font-medium">{selectedUser.nome}</p>
                  <p className="text-gray-400 text-sm">Saldo atual: R$ {selectedUser.saldo.toFixed(2)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Valor a creditar</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="bg-gray-900 border-gray-800 text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Observação (opcional)</label>
                  <Input
                    value={creditNote}
                    onChange={(e) => setCreditNote(e.target.value)}
                    className="bg-gray-900 border-gray-800 text-white"
                    placeholder="Motivo do crédito..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Dialog.Close asChild>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                    >
                      Cancelar
                    </Button>
                  </Dialog.Close>
                  <Button
                    onClick={handleCreditBalance}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!creditAmount || parseFloat(creditAmount) <= 0}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Creditar
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

export default UsersManagement