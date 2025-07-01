import React from 'react'
import { useEffect, useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/input'
import { CreditCard, Search, ArrowUpRight, ArrowDownLeft, Calendar, User, DollarSign, Filter } from 'lucide-react'
import { ListLoading } from '../../components/ui/unified-loading'

interface Transacao {
  id: string
  tipo: 'credito' | 'debito'
  valor: number
  motivo: string
  created_at: string
  user_id: string
  referencia_tipo?: string
  users?: {
    nome: string
    email: string
  }
  saldo_anterior?: number
  saldo_atual?: number
}

const motion = {
  div: (props: any) => <div {...props} />,
  h1: (props: any) => <h1 {...props} />,
  h3: (props: any) => <h3 {...props} />,
  p: (props: any) => <p {...props} />,
  select: (props: any) => <select {...props} />,
  span: (props: any) => <span {...props} />,
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
      
      // Buscar dados reais do Supabase
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
      
      // Se não houver dados, apenas setar array vazio
      setTransacoes(data || [])
    } catch (error) {
      console.error('Error fetching transacoes:', error)
      setTransacoes([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTransacoes = transacoes.filter(transacao => {
    const matchesSearch = (transacao.motivo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transacao.users?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = filtroTipo === 'todos' || transacao.tipo === filtroTipo
    return matchesSearch && matchesTipo
  })

  const totalCredito = transacoes.filter(t => t.tipo === 'credito').reduce((sum, t) => sum + t.valor, 0)
  const totalDebito = transacoes.filter(t => t.tipo === 'debito').reduce((sum, t) => sum + t.valor, 0)
  const saldoLiquido = totalCredito - totalDebito

  if (loading) {
    return <ListLoading isLoading={loading} message="Carregando transações..." />
  }

  return (
    <div className="min-h-screen bg-black pt-16 lg:pt-0">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm sticky top-16 lg:top-0 z-10"
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 sm:py-4 bg-black/40 backdrop-blur-sm border-gray-800/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-base sm:text-lg transition-all duration-200"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <motion.select
                whileHover={{ scale: 1.02 }}
                value={filtroTipo}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroTipo(e.target.value as 'todos' | 'credito' | 'debito')}
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
                  className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-3 sm:p-4 hover:border-gray-700/50 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${
                        transacao.tipo === 'credito' 
                          ? 'from-green-500/10 to-green-600/5 border border-green-500/20' 
                          : 'from-red-500/10 to-red-600/5 border border-red-500/20'
                      }`}>
                        {transacao.tipo === 'credito' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-400" />
                        ) : (
                          <ArrowDownLeft className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                          {transacao.tipo === 'credito' ? 'Crédito' : 'Débito'}
                        </h3>
                        <p className="text-gray-400 text-xs">
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
                      <p className={`text-xl font-bold ${
                        transacao.tipo === 'credito' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transacao.tipo === 'credito' ? '+' : '-'}R$ {transacao.valor.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{transacao.tipo}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {/* Descrição */}
                    <div className="p-2 rounded bg-black/40 backdrop-blur-sm border border-gray-800/50">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="text-blue-400 text-xs font-medium">Descrição</span>
                      </div>
                      <p className="text-white text-sm">{transacao.motivo}</p>
                      {transacao.referencia_tipo && (
                        <p className="text-xs text-gray-400 mt-1 capitalize">
                          Origem: {transacao.referencia_tipo.replace('_', ' ')}
                        </p>
                      )}
                    </div>

                    {/* User Info - Only for admin */}
                    {user?.role === 'admin' && transacao.users && (
                      <div className="p-2 rounded bg-black/40 backdrop-blur-sm border border-gray-800/50">
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4 text-purple-400" />
                          <span className="text-purple-400 text-xs font-medium">Usuário</span>
                        </div>
                        <p className="text-white font-medium text-sm">{transacao.users.nome}</p>
                        <p className="text-xs text-gray-400">{transacao.users.email}</p>
                      </div>
                    )}

                    {/* Date Info */}
                    {(!user?.role || user.role !== 'admin' || !transacao.users) && (
                      <div className="p-2 rounded bg-black/40 backdrop-blur-sm border border-gray-800/50">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-orange-400" />
                          <span className="text-orange-400 text-xs font-medium">Data</span>
                        </div>
                        <p className="text-white text-sm">
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