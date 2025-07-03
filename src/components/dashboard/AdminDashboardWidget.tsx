import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Users,
  Router,
  TrendingUp,
  Activity,
  Crown,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3
} from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface AdminStats {
  totalUsuarios: number
  totalMikrotiks: number
  totalVendas: number
  totalComissoes: number
  vendasHoje: number
  vendasMes: number
  usuariosAtivos: number
  mikrotiksAtivos: number
  receitaTotal: number
  receitaHoje: number
  receitaMes: number
  topUsuarios: Array<{
    id: string
    nome: string
    email: string
    vendas: number
    comissao: number
  }>
  saquesPendentes: number
  valorSaquesPendentes: number
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  apiLatency: number
  databaseConnections: number
  lastBackup: string
}

export function AdminDashboardWidget() {
  const { user } = useAuthContext()
  const [stats, setStats] = useState<AdminStats>({
    totalUsuarios: 0,
    totalMikrotiks: 0,
    totalVendas: 0,
    totalComissoes: 0,
    vendasHoje: 0,
    vendasMes: 0,
    usuariosAtivos: 0,
    mikrotiksAtivos: 0,
    receitaTotal: 0,
    receitaHoje: 0,
    receitaMes: 0,
    topUsuarios: [],
    saquesPendentes: 0,
    valorSaquesPendentes: 0
  })
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: 99.9,
    apiLatency: 120,
    databaseConnections: 45,
    lastBackup: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminStats()
    }
  }, [user])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)

      // Data atual
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Buscar usuários
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome, email, saldo, created_at')

      // Buscar MikroTiks
      const { data: mikrotiks, error: mikrotiksError } = await supabase
        .from('mikrotiks')
        .select('id, nome, ip, ativo, user_id, created_at')

      // Buscar vendas PIX
      const { data: vendasPix, error: vendasPixError } = await supabase
        .from('vendas_pix')
        .select('*')
        .eq('status', 'completed')

      // Buscar vouchers físicos
      const { data: vouchers, error: vouchersError } = await supabase
        .from('voucher')
        .select('*')

      // Buscar saques pendentes
      const { data: saques, error: saquesError } = await supabase
        .from('saques')
        .select('*')
        .eq('status', 'pending')

      if (usuariosError) console.error('Erro ao buscar usuários:', usuariosError)
      if (mikrotiksError) console.error('Erro ao buscar MikroTiks:', mikrotiksError)
      if (vendasPixError) console.error('Erro ao buscar vendas PIX:', vendasPixError)
      if (vouchersError) console.error('Erro ao buscar vouchers:', vouchersError)
      if (saquesError) console.error('Erro ao buscar saques:', saquesError)

      // Calcular estatísticas
      const totalUsuarios = usuarios?.length || 0
      const totalMikrotiks = mikrotiks?.length || 0
      const mikrotiksAtivos = mikrotiks?.filter(m => m.ativo).length || 0
      
      // Vendas PIX
      const vendasPixTotal = vendasPix || []
      const vendasPixHoje = vendasPixTotal.filter(v => new Date(v.created_at) >= today)
      const vendasPixMes = vendasPixTotal.filter(v => new Date(v.created_at) >= firstDayOfMonth)
      
      // Vouchers
      const vouchersTotal = vouchers || []
      const vouchersHoje = vouchersTotal.filter(v => new Date(v.created_at) >= today)
      const vouchersMes = vouchersTotal.filter(v => new Date(v.created_at) >= firstDayOfMonth)
      
      // Receitas
      const receitaTotal = vendasPixTotal.reduce((sum, v) => sum + (v.valor_admin || 0), 0)
      const receitaHoje = vendasPixHoje.reduce((sum, v) => sum + (v.valor_admin || 0), 0)
      const receitaMes = vendasPixMes.reduce((sum, v) => sum + (v.valor_admin || 0), 0)
      
      // Comissões dos usuários
      const totalComissoes = vendasPixTotal.reduce((sum, v) => sum + (v.valor_usuario || 0), 0)
      
      // Top usuários por vendas
      const vendasPorUsuario = vendasPixTotal.reduce((acc, venda) => {
        if (venda.mikrotik_id) {
          const mikrotik = mikrotiks?.find(m => m.id === venda.mikrotik_id)
          if (mikrotik?.user_id) {
            if (!acc[mikrotik.user_id]) {
              acc[mikrotik.user_id] = {
                vendas: 0,
                comissao: 0
              }
            }
            acc[mikrotik.user_id].vendas += 1
            acc[mikrotik.user_id].comissao += venda.valor_usuario || 0
          }
        }
        return acc
      }, {} as Record<string, { vendas: number; comissao: number }>)

      const topUsuarios = Object.entries(vendasPorUsuario)
        .map(([userId, data]) => {
          const usuario = usuarios?.find(u => u.id === userId)
          const userData = data as { vendas: number; comissao: number }
          return {
            id: userId,
            nome: usuario?.nome || 'Usuário',
            email: usuario?.email || '',
            vendas: userData.vendas,
            comissao: userData.comissao
          }
        })
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 5)

      // Saques pendentes
      const saquesPendentes = saques?.length || 0
      const valorSaquesPendentes = saques?.reduce((sum, s) => sum + s.valor, 0) || 0

      setStats({
        totalUsuarios,
        totalMikrotiks,
        totalVendas: vendasPixTotal.length + vouchersTotal.length,
        totalComissoes,
        vendasHoje: vendasPixHoje.length + vouchersHoje.length,
        vendasMes: vendasPixMes.length + vouchersMes.length,
        usuariosAtivos: totalUsuarios, // Assumindo que todos são ativos
        mikrotiksAtivos,
        receitaTotal,
        receitaHoje,
        receitaMes,
        topUsuarios,
        saquesPendentes,
        valorSaquesPendentes
      })

    } catch (error) {
      console.error('Erro ao buscar estatísticas do admin:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDateManaus = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Manaus'
    })
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/10'
      case 'warning': return 'text-yellow-400 bg-yellow-500/10'
      case 'critical': return 'text-red-400 bg-red-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <XCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-red-400 mx-auto mb-2" />
        <p className="text-red-400">Acesso negado. Apenas administradores podem ver este dashboard.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700/30 rounded mb-2"></div>
                <div className="h-8 bg-gray-700/30 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-green-200/80 text-sm font-medium">Receita Total</p>
              <p className="text-2xl font-bold text-green-100">{formatCurrency(stats.receitaTotal)}</p>
              <p className="text-xs text-green-300/80">Admin (30%)</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/30 border border-green-400/30">
              <DollarSign className="h-6 w-6 text-green-300" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-green-400/80 font-medium">
              Hoje: {formatCurrency(stats.receitaHoje)}
            </div>
            <div className="text-xs text-green-300/70">
              Mês: {formatCurrency(stats.receitaMes)}
            </div>
          </div>
        </motion.div>

        {/* Total de Vendas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-blue-200/80 text-sm font-medium">Total de Vendas</p>
              <p className="text-2xl font-bold text-blue-100">{stats.totalVendas.toLocaleString()}</p>
              <p className="text-xs text-blue-300/80">PIX + Vouchers</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/30 border border-blue-400/30">
              <TrendingUp className="h-6 w-6 text-blue-300" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-blue-400/80 font-medium">
              Hoje: {stats.vendasHoje} vendas
            </div>
            <div className="text-xs text-blue-300/70">
              Mês: {stats.vendasMes} vendas
            </div>
          </div>
        </motion.div>

        {/* Usuários */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-purple-200/80 text-sm font-medium">Usuários</p>
              <p className="text-2xl font-bold text-purple-100">{stats.totalUsuarios}</p>
              <p className="text-xs text-purple-300/80">{stats.usuariosAtivos} ativos</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/30 border border-purple-400/30">
              <Users className="h-6 w-6 text-purple-300" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-purple-400/80 font-medium">
              Comissões: {formatCurrency(stats.totalComissoes)}
            </div>
            <div className="text-xs text-purple-300/70">
              Média: {formatCurrency(stats.totalUsuarios > 0 ? stats.totalComissoes / stats.totalUsuarios : 0)}
            </div>
          </div>
        </motion.div>

        {/* MikroTiks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-6 hover:border-orange-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-orange-200/80 text-sm font-medium">MikroTiks</p>
              <p className="text-2xl font-bold text-orange-100">{stats.totalMikrotiks}</p>
              <p className="text-xs text-orange-300/80">{stats.mikrotiksAtivos} ativos</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/30 border border-orange-400/30">
              <Router className="h-6 w-6 text-orange-300" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-orange-400/80 font-medium">
              Taxa ativa: {((stats.mikrotiksAtivos / stats.totalMikrotiks) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-orange-300/70">
              Conexões estáveis
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saques Pendentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Saques Pendentes</h3>
            <Badge variant={stats.saquesPendentes > 0 ? "destructive" : "default"}>
              {stats.saquesPendentes} pendentes
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                <Zap className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{stats.saquesPendentes} saques</p>
                <p className="text-sm text-gray-400">Aguardando processamento</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-yellow-400">{formatCurrency(stats.valorSaquesPendentes)}</p>
              <p className="text-xs text-gray-400">Valor total</p>
            </div>
          </div>
          
          {stats.saquesPendentes > 0 && (
            <div className="mt-4">
              <Button 
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                onClick={() => window.location.href = '/saques'}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Processar Saques
              </Button>
            </div>
          )}
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Status do Sistema</h3>
            <Badge className={getHealthColor(systemHealth.status)}>
              {getHealthIcon(systemHealth.status)}
              <span className="ml-1 capitalize">{systemHealth.status}</span>
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/30">
              <span className="text-sm text-gray-300">Uptime</span>
              <span className="text-sm font-medium text-green-400">{systemHealth.uptime}%</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/30">
              <span className="text-sm text-gray-300">Latência API</span>
              <span className="text-sm font-medium text-blue-400">{systemHealth.apiLatency}ms</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/30">
              <span className="text-sm text-gray-300">Conexões DB</span>
              <span className="text-sm font-medium text-purple-400">{systemHealth.databaseConnections}/100</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/30">
              <span className="text-sm text-gray-300">Último Backup</span>
              <span className="text-sm font-medium text-gray-400">
                {formatDateManaus(systemHealth.lastBackup)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Top Usuários</h3>
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          {stats.topUsuarios.length > 0 ? (
            stats.topUsuarios.map((usuario, index) => (
              <div
                key={usuario.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{usuario.nome}</p>
                    <p className="text-xs text-gray-400">{usuario.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-400">{usuario.vendas} vendas</p>
                  <p className="text-xs text-gray-500">{formatCurrency(usuario.comissao)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Nenhuma venda registrada ainda</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
} 