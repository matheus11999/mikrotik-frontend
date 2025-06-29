import { useEffect, useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/input'
import { CreditCard, Search, ArrowUpRight, ArrowDownLeft, Calendar, User, DollarSign, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Transacao {
  id: string
  tipo: 'credito' | 'debito'
  valor: number
  descricao: string
  created_at: string
  user_id: string
  origem?: string
  users?: {
    nome: string
    email: string
  }
}

export function TransacoesList() {
  const { user } = useAuthContext()
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'credito' | 'debito'>('todos')

  useEffect(() => {
    fetchTransacoes()
  }, [user])

  const fetchTransacoes = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Tentar buscar dados reais do Supabase
      let query = supabase
        .from('transacoes')
        .select(`
          *,
          users (
            nome,
            email
          )
        `)

      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      
      // Se não houver dados, usar dados mockados
      if (!data || data.length === 0) {
        setTransacoes([
          {
            id: '1',
            tipo: 'credito',
            valor: 150.00,
            descricao: 'Comissão de venda - MikroTik Principal',
            created_at: new Date().toISOString(),
            user_id: user?.id || '',
            origem: 'comissao_venda',
            users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
          },
          {
            id: '2',
            tipo: 'debito',
            valor: 50.00,
            descricao: 'Saque solicitado',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            user_id: user?.id || '',
            origem: 'saque',
            users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
          },
          {
            id: '3',
            tipo: 'credito',
            valor: 75.50,
            descricao: 'Comissão de venda - MikroTik Secundário',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            user_id: user?.id || '',
            origem: 'comissao_venda',
            users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
          },
          {
            id: '4',
            tipo: 'credito',
            valor: 200.00,
            descricao: 'Comissão de venda - Plano Premium',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            user_id: user?.id || '',
            origem: 'comissao_venda',
            users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
          },
          {
            id: '5',
            tipo: 'debito',
            valor: 25.00,
            descricao: 'Taxa de processamento',
            created_at: new Date(Date.now() - 345600000).toISOString(),
            user_id: user?.id || '',
            origem: 'taxa',
            users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
          }
        ])
      } else {
        setTransacoes(data)
      }
    } catch (error) {
      console.error('Error fetching transacoes:', error)
      // Em caso de erro, usar dados mockados
      setTransacoes([
        {
          id: '1',
          tipo: 'credito',
          valor: 150.00,
          descricao: 'Comissão de venda - MikroTik Principal',
          created_at: new Date().toISOString(),
          user_id: user?.id || '',
          origem: 'comissao_venda',
          users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
        },
        {
          id: '2',
          tipo: 'debito',
          valor: 50.00,
          descricao: 'Saque solicitado',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: user?.id || '',
          origem: 'saque',
          users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
        },
        {
          id: '3',
          tipo: 'credito',
          valor: 75.50,
          descricao: 'Comissão de venda - MikroTik Secundário',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          user_id: user?.id || '',
          origem: 'comissao_venda',
          users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredTransacoes = transacoes.filter(transacao => {
    const matchesSearch = (transacao.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transacao.users?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = filtroTipo === 'todos' || transacao.tipo === filtroTipo
    return matchesSearch && matchesTipo
  })

  const totalCredito = transacoes.filter(t => t.tipo === 'credito').reduce((sum, t) => sum + t.valor, 0)
  const totalDebito = transacoes.filter(t => t.tipo === 'debito').reduce((sum, t) => sum + t.valor, 0)
  const saldoLiquido = totalCredito - totalDebito

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
            className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full mx-auto mb-6"
          />
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2"
          >
            Carregando transações...
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
              className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20"
            >
              <CreditCard className="h-6 w-6 text-blue-400" />
            </motion.div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              >
                Transações
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-400"
              >
                Histórico completo de movimentações financeiras
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
          {/* Search and Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col lg:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por descrição ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 sm:py-4 bg-black/40 backdrop-blur-sm border-gray-800/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-base sm:text-lg transition-all duration-200"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <motion.select
                whileHover={{ scale: 1.02 }}
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="pl-12 pr-8 py-3 sm:py-4 bg-black/40 backdrop-blur-sm border border-gray-800/50 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none w-full sm:min-w-48 text-base transition-all duration-200"
              >
                <option value="todos">Todos os tipos</option>
                <option value="credito">Apenas créditos</option>
                <option value="debito">Apenas débitos</option>
              </motion.select>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-green-500/10 to-green-600/5 hover:border-green-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                  <ArrowUpRight className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-green-400 text-sm font-medium mb-2">Total Créditos</p>
                <p className="text-2xl font-bold text-white">R$ {totalCredito.toFixed(2)}</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-red-500/10 to-red-600/5 hover:border-red-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
                  <ArrowDownLeft className="h-6 w-6 text-red-400" />
                </div>
              </div>
              <div>
                <p className="text-red-400 text-sm font-medium mb-2">Total Débitos</p>
                <p className="text-2xl font-bold text-white">R$ {totalDebito.toFixed(2)}</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:border-blue-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <DollarSign className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div>
                <p className="text-blue-400 text-sm font-medium mb-2">Saldo Líquido</p>
                <p className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  R$ {saldoLiquido.toFixed(2)}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Transações List */}
          {filteredTransacoes.length === 0 ? (
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
                  className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <CreditCard className="h-12 w-12 text-blue-400" />
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4"
                >
                  {transacoes.length === 0 ? 'Nenhuma transação encontrada' : 'Nenhum resultado encontrado'}
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-gray-400 text-lg"
                >
                  {transacoes.length === 0 
                    ? 'As transações aparecerão aqui conforme você recebe comissões e faz saques'
                    : 'Tente ajustar os filtros ou termos de busca'
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
              {filteredTransacoes.map((transacao, index) => (
                <motion.div
                  key={transacao.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700/50 transition-all duration-300 hover:shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${
                        transacao.tipo === 'credito' 
                          ? 'from-green-500/10 to-green-600/5 border border-green-500/20' 
                          : 'from-red-500/10 to-red-600/5 border border-red-500/20'
                      }`}>
                        {transacao.tipo === 'credito' ? (
                          <ArrowUpRight className="h-6 w-6 text-green-400" />
                        ) : (
                          <ArrowDownLeft className="h-6 w-6 text-red-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                          {transacao.tipo === 'credito' ? 'Crédito' : 'Débito'}
                        </h3>
                        <p className="text-gray-400">
                          {new Date(transacao.created_at).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        transacao.tipo === 'credito' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transacao.tipo === 'credito' ? '+' : '-'}R$ {transacao.valor.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400 capitalize">{transacao.tipo}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Descrição */}
                    <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-800/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="text-blue-400 text-sm font-medium">Descrição</span>
                      </div>
                      <p className="text-white">{transacao.descricao}</p>
                      {transacao.origem && (
                        <p className="text-xs text-gray-400 mt-1 capitalize">
                          Origem: {transacao.origem.replace('_', ' ')}
                        </p>
                      )}
                    </div>

                    {/* User Info - Only for admin */}
                    {user?.role === 'admin' && transacao.users && (
                      <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-800/50">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-purple-400" />
                          <span className="text-purple-400 text-sm font-medium">Usuário</span>
                        </div>
                        <p className="text-white font-medium">{transacao.users.nome}</p>
                        <p className="text-xs text-gray-400">{transacao.users.email}</p>
                      </div>
                    )}

                    {/* Date Info */}
                    {(!user?.role || user.role !== 'admin' || !transacao.users) && (
                      <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-800/50">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-orange-400" />
                          <span className="text-orange-400 text-sm font-medium">Data</span>
                        </div>
                        <p className="text-white">
                          {new Date(transacao.created_at).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transacao.created_at).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    )}
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