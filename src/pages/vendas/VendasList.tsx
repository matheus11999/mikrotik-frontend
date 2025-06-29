import { useEffect, useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { 
  ShoppingCart, Search, TrendingUp, DollarSign, Calendar, 
  User, Router, Eye, Clock, CheckCircle, XCircle, 
  Loader2, Filter, ArrowUpDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Venda {
  id: string
  payment_id: string
  mikrotik_id: string
  plano_id: string
  status: string
  valor_total: number
  valor_admin: number
  valor_usuario: number
  mercadopago_status: string
  mac_address: string
  usuario_criado: string
  senha_usuario: string
  paid_at: string
  created_at: string
  updated_at: string
  mikrotiks?: {
    nome: string
    porcentagem: number
    users?: {
      nome: string
      email: string
    }
  }
  planos?: {
    nome: string
    valor: number
    session_timeout: number
  }
}

export function VendasList() {
  const { user } = useAuthContext()
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchVendas()
  }, [user])

  const fetchVendas = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('vendas')
        .select(`
          *,
          mikrotiks (
            nome,
            porcentagem,
            users (
              nome,
              email
            )
          ),
          planos (
            nome,
            valor,
            session_timeout
          )
        `)

      // Se não é admin, mostrar apenas vendas dos seus MikroTiks
      if (user.role !== 'admin') {
        const { data: userMikrotiks } = await supabase
          .from('mikrotiks')
          .select('id')
          .eq('user_id', user.id)
        
        const mikrotikIds = userMikrotiks?.map(m => m.id) || []
        if (mikrotikIds.length > 0) {
          query = query.in('mikrotik_id', mikrotikIds)
        } else {
          // Se não tem MikroTiks, não mostrar nenhuma venda
          setVendas([])
          setLoading(false)
          return
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setVendas(data || [])
    } catch (error) {
      console.error('Error fetching vendas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVendas = vendas.filter(venda => {
    const matchesSearch = 
      (venda.mac_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (venda.payment_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (venda.mikrotiks?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (venda.mikrotiks?.users?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (venda.planos?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || venda.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string, mercadopagoStatus?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✅ Completa</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">⏳ Pendente</Badge>
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">❌ Falhou</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">⏹️ Cancelada</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  // Estatísticas
  const totalVendas = filteredVendas.reduce((sum, venda) => sum + Number(venda.valor_total), 0)
  const totalComissaoAdmin = filteredVendas.reduce((sum, venda) => sum + Number(venda.valor_admin), 0)
  const totalComissaoUsuario = filteredVendas.reduce((sum, venda) => sum + Number(venda.valor_usuario), 0)
  const vendasCompletas = filteredVendas.filter(v => v.status === 'completed').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-16 lg:pt-0 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full mx-auto mb-6"
          />
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2"
          >
            Carregando vendas...
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-16 lg:pt-0">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm sticky top-0 lg:top-0 z-10"
      >
        <div className="px-4 sm:px-6 py-6">
          <div className="flex items-center space-x-4">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20"
            >
              <ShoppingCart className="h-6 w-6 text-green-400" />
            </motion.div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              >
                Histórico de Vendas
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-400"
              >
                {user?.role === 'admin' ? 'Todas as vendas do sistema' : 'Vendas dos seus MikroTiks'}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Filtros */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por MAC, ID do pagamento, MikroTik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-black/40 backdrop-blur-sm border-gray-800/50 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl transition-all duration-200"
              />
            </div>
            <motion.select
              whileHover={{ scale: 1.02 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-black/40 backdrop-blur-sm border border-gray-800/50 text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">✅ Completas</option>
              <option value="pending">⏳ Pendentes</option>
              <option value="failed">❌ Falharam</option>
              <option value="cancelled">⏹️ Canceladas</option>
            </motion.select>
          </motion.div>

          {/* Estatísticas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-green-500/10 to-green-600/5 hover:border-green-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-green-400 text-sm font-medium mb-2">Total Vendas</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalVendas)}</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:border-blue-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div>
                <p className="text-blue-400 text-sm font-medium mb-2">
                  {user?.role === 'admin' ? 'Comissão Admin' : 'Sua Comissão'}
                </p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(user?.role === 'admin' ? totalComissaoAdmin : totalComissaoUsuario)}
                </p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                  <CheckCircle className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <div>
                <p className="text-purple-400 text-sm font-medium mb-2">Completas</p>
                <p className="text-2xl font-bold text-white">{vendasCompletas}</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:border-orange-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                  <ShoppingCart className="h-6 w-6 text-orange-400" />
                </div>
              </div>
              <div>
                <p className="text-orange-400 text-sm font-medium mb-2">Total</p>
                <p className="text-2xl font-bold text-white">{filteredVendas.length}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Lista de Vendas */}
          {filteredVendas.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center py-16"
            >
              <div className="text-center max-w-md">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <ShoppingCart className="h-12 w-12 text-green-400" />
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4"
                >
                  {vendas.length === 0 ? 'Nenhuma venda registrada' : 'Nenhum resultado encontrado'}
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-gray-400 text-lg"
                >
                  {vendas.length === 0 
                    ? 'As vendas aparecerão aqui quando forem registradas no sistema'
                    : 'Tente ajustar os filtros de busca'
                  }
                </motion.p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              {filteredVendas.map((venda, index) => (
                <motion.div
                  key={venda.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700/50 transition-all duration-300 hover:shadow-2xl"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Informações Principais */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {getStatusBadge(venda.status, venda.mercadopago_status)}
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                          ID: {venda.payment_id.substring(0, 8)}...
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Router className="h-4 w-4 text-blue-400" />
                          <span className="text-gray-400">MikroTik:</span>
                          <span className="text-white font-medium">{venda.mikrotiks?.nome || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-400" />
                          <span className="text-gray-400">Usuário:</span>
                          <span className="text-white font-medium">{venda.mikrotiks?.users?.nome || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-purple-400" />
                          <span className="text-gray-400">Plano:</span>
                          <span className="text-white font-medium">{venda.planos?.nome || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">MAC:</span>
                          <span className="text-white font-mono text-xs">{venda.mac_address}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-400">Criada:</span>
                          <span className="text-white text-xs">{formatDate(venda.created_at)}</span>
                        </div>
                        
                        {venda.paid_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-gray-400">Paga:</span>
                            <span className="text-white text-xs">{formatDate(venda.paid_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Valores */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[200px]">
                      <div className="text-center lg:text-right">
                        <p className="text-xs text-gray-400 mb-1">Valor Total</p>
                        <p className="text-xl font-bold text-green-400">{formatCurrency(Number(venda.valor_total))}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-center lg:text-right">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            {user?.role === 'admin' ? 'Admin' : 'Sua parte'}
                          </p>
                          <p className="text-sm font-semibold text-blue-400">
                            {formatCurrency(Number(user?.role === 'admin' ? venda.valor_admin : venda.valor_usuario))}
                          </p>
                        </div>
                        
                        {user?.role === 'admin' && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Usuário</p>
                            <p className="text-sm font-semibold text-purple-400">
                              {formatCurrency(Number(venda.valor_usuario))}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}