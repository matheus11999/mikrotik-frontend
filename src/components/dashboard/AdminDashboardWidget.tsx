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
  BarChart3,
  Calendar,
  Target,
  Wallet,
  CreditCard,
  PieChart,
  Award,
  Eye,
  RefreshCw,
  Sparkles,
  TrendingDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface AdminMetrics {
  // Comissões do admin (valor_admin)
  comissaoTotal: number
  comissaoHoje: number
  comissaoSemana: number
  comissaoMes: number
  
  // Saldo total dos usuários
  saldoTotalUsuarios: number
  
  // Vendas PIX recentes
  vendasPixRecentes: Array<{
    id: string
    payment_id: string
    valor_total: number
    valor_admin: number
    valor_usuario: number
    mac_address: string
    created_at: string
    mikrotik_nome?: string
    user_nome?: string
    plano_nome?: string
  }>
  
  // Ranking de usuários com mais saldo (top 5)
  topUsuariosSaldo: Array<{
    id: string
    nome: string
    email: string
    saldo: number
    total_vendas: number
    total_comissao: number
  }>
  
  // Usuários com saque automático ativado e saldo >= 50
  usuariosSaqueAutomatico: Array<{
    id: string
    nome: string
    email: string
    saldo: number
    saque_automatico: boolean
    total_vendas: number
  }>
  
  // Estatísticas gerais
  totalUsuarios: number
  totalMikrotiks: number
  totalVendasPix: number
  totalVendasHoje: number
  totalVendasMes: number
  
  // Métricas de crescimento
  crescimentoComissao: number // % comparado ao mês anterior
  crescimentoUsuarios: number // % comparado ao mês anterior
}

// helper to convert potential string numerics to number
const toNumber = (val: unknown) => {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return val
  const parsed = Number(val)
  return isNaN(parsed) ? 0 : parsed
}

export function AdminDashboardWidget() {
  const { user } = useAuthContext()
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminMetrics()
    }
  }, [user])

  const fetchAdminMetrics = async () => {
    try {
      setRefreshing(true)
      if (metrics === null) setLoading(true)

      console.log('🔄 [ADMIN-DASHBOARD] Buscando métricas do admin...')

      // Datas para filtros
      const now = new Date()
      const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - hoje.getDay()) // Domingo
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
      const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const fimMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0)

      // Buscar dados em paralelo
      const [
        vendasPixResult,
        vendasPixHojeResult,
        vendasPixSemanaResult,
        vendasPixMesResult,
        vendasPixMesAnteriorResult,
        usuariosResult,
        mikrotiksResult,
        vendasPixRecentesResult
      ] = await Promise.all([
        // Todas as vendas PIX finalizadas
        supabase
          .from('vendas_pix')
          .select('valor_admin, valor_usuario, valor_total, created_at')
          .in('status', ['completed', 'approved']),

        // Vendas PIX de hoje
        supabase
          .from('vendas_pix')
          .select('valor_admin, valor_usuario, valor_total')
          .in('status', ['completed', 'approved'])
          .gte('created_at', hoje.toISOString()),

        // Vendas PIX da semana
        supabase
          .from('vendas_pix')
          .select('valor_admin, valor_usuario, valor_total')
          .in('status', ['completed', 'approved'])
          .gte('created_at', inicioSemana.toISOString()),

        // Vendas PIX do mês
        supabase
          .from('vendas_pix')
          .select('valor_admin, valor_usuario, valor_total')
          .in('status', ['completed', 'approved'])
          .gte('created_at', inicioMes.toISOString()),

        // Vendas PIX do mês anterior
        supabase
          .from('vendas_pix')
          .select('valor_admin, valor_usuario, valor_total')
          .in('status', ['completed', 'approved'])
          .gte('created_at', mesAnterior.toISOString())
          .lte('created_at', fimMesAnterior.toISOString()),

        // Usuários com dados completos
        supabase
          .from('users')
          .select('id, nome, email, saldo, saque_automatico, created_at')
          .eq('role', 'user'),

        // MikroTiks
        supabase
          .from('mikrotiks')
          .select('id, nome, ativo, user_id'),

        // Vendas PIX recentes (últimas 20)
        supabase
          .from('vendas_pix')
          .select(`
            id, payment_id, valor_total, valor_admin, valor_usuario, 
            mac_address, created_at, plano_nome,
            mikrotiks!inner(nome, user_id, users!inner(nome))
          `)
          .in('status', ['completed', 'approved'])
          .order('created_at', { ascending: false })
          .limit(20)
      ])

      console.log('📊 [ADMIN-DASHBOARD] Dados coletados:', {
        vendasPix: vendasPixResult.data?.length,
        usuarios: usuariosResult.data?.length,
        mikrotiks: mikrotiksResult.data?.length,
        vendasRecentes: vendasPixRecentesResult.data?.length
      })

      // helper to get admin commission for a sale
      const getAdminCommission = (v:any)=>{
        const adminVal = toNumber(v.valor_admin)
        if(adminVal>0) return adminVal
        // fallback calculate
        return Math.max(0, toNumber(v.valor_total) - toNumber(v.valor_usuario))
      }

      // Calcular comissões do admin (valor_admin)
      const comissaoTotal = vendasPixResult.data?.reduce((sum, v) => sum + getAdminCommission(v), 0) || 0
      const comissaoHoje = vendasPixHojeResult.data?.reduce((sum, v) => sum + getAdminCommission(v), 0) || 0
      const comissaoSemana = vendasPixSemanaResult.data?.reduce((sum, v) => sum + getAdminCommission(v), 0) || 0
      const comissaoMes = vendasPixMesResult.data?.reduce((sum, v) => sum + getAdminCommission(v), 0) || 0
      const comissaoMesAnterior = vendasPixMesAnteriorResult.data?.reduce((sum, v) => sum + getAdminCommission(v), 0) || 0

      // Calcular saldo total dos usuários
      const saldoTotalUsuarios = usuariosResult.data?.reduce((sum, u) => sum + toNumber(u.saldo), 0) || 0

      // Processar vendas PIX recentes
      const vendasPixRecentes = vendasPixRecentesResult.data?.map(v => ({
        id: v.id,
        payment_id: v.payment_id,
        valor_total: toNumber(v.valor_total),
        valor_admin: toNumber(v.valor_admin),
        valor_usuario: toNumber(v.valor_usuario),
        mac_address: v.mac_address || '',
        created_at: v.created_at,
        plano_nome: v.plano_nome || 'Plano PIX',
        mikrotik_nome: (v.mikrotiks as any)?.nome || 'MikroTik',
        user_nome: (v.mikrotiks as any)?.users?.nome || 'Usuário'
      })) || []

      // Calcular total de vendas por usuário para ranking e estatísticas
      const vendasPorUsuario = vendasPixResult.data?.reduce((acc, venda) => {
        // Vamos usar as vendas recentes para mapear usuários
        const vendaRecente = vendasPixRecentes.find(vr => 
          vr.valor_admin === venda.valor_admin && 
          vr.valor_total === venda.valor_total &&
          Math.abs(new Date(vr.created_at).getTime() - new Date(venda.created_at).getTime()) < 1000
        )
        
        if (vendaRecente && vendaRecente.user_nome && vendaRecente.user_nome !== 'Usuário') {
          const userId = vendaRecente.user_nome // Usando nome como chave temporária
          if (!acc[userId]) {
            acc[userId] = {
              total_vendas: 0,
              total_comissao: 0
            }
          }
          acc[userId].total_vendas += 1
          acc[userId].total_comissao += venda.valor_usuario || 0
        }
        return acc
      }, {} as Record<string, { total_vendas: number; total_comissao: number }>) || {}

      // Top usuários por saldo (top 5)
      const topUsuariosSaldo = usuariosResult.data
        ?.map(u => ({
          id: u.id,
          nome: u.nome || 'Usuário',
          email: u.email || '',
          saldo: u.saldo || 0,
          total_vendas: vendasPorUsuario[u.nome]?.total_vendas || 0,
          total_comissao: vendasPorUsuario[u.nome]?.total_comissao || 0
        }))
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 5) || []

      // Usuários com saque automático ativado e saldo >= 50
      const usuariosSaqueAutomatico = usuariosResult.data
        ?.filter(u => u.saque_automatico === true && (u.saldo || 0) >= 50)
        .map(u => ({
          id: u.id,
          nome: u.nome || 'Usuário',
          email: u.email || '',
          saldo: u.saldo || 0,
          saque_automatico: u.saque_automatico || false,
          total_vendas: vendasPorUsuario[u.nome]?.total_vendas || 0
        })) || []

      // Calcular crescimento
      const crescimentoComissao = comissaoMesAnterior > 0 
        ? ((comissaoMes - comissaoMesAnterior) / comissaoMesAnterior) * 100 
        : 0

      const usuariosAtivos = usuariosResult.data?.filter(u => {
        const created = new Date(u.created_at)
        return created >= inicioMes
      }).length || 0

      const usuariosMesAnterior = usuariosResult.data?.filter(u => {
        const created = new Date(u.created_at)
        return created >= mesAnterior && created <= fimMesAnterior
      }).length || 0

      const crescimentoUsuarios = usuariosMesAnterior > 0 
        ? ((usuariosAtivos - usuariosMesAnterior) / usuariosMesAnterior) * 100 
        : 0

      const adminMetrics: AdminMetrics = {
        comissaoTotal,
        comissaoHoje,
        comissaoSemana,
        comissaoMes,
        saldoTotalUsuarios,
        vendasPixRecentes,
        topUsuariosSaldo,
        usuariosSaqueAutomatico,
        totalUsuarios: usuariosResult.data?.length || 0,
        totalMikrotiks: mikrotiksResult.data?.length || 0,
        totalVendasPix: vendasPixResult.data?.length || 0,
        totalVendasHoje: vendasPixHojeResult.data?.length || 0,
        totalVendasMes: vendasPixMesResult.data?.length || 0,
        crescimentoComissao,
        crescimentoUsuarios
      }

      console.log('✅ [ADMIN-DASHBOARD] Métricas calculadas:', adminMetrics)
      setMetrics(adminMetrics)

    } catch (error) {
      console.error('❌ [ADMIN-DASHBOARD] Erro ao buscar métricas:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Manaus'
    })
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
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
          {[...Array(8)].map((_, i) => (
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

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
        <p className="text-gray-400">Erro ao carregar métricas do dashboard</p>
        <Button onClick={fetchAdminMetrics} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Admin</h2>
          <p className="text-gray-400">Métricas e análise do sistema</p>
        </div>
        <Button 
          onClick={fetchAdminMetrics} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Métricas de Comissão */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Comissão Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-emerald-200/80 text-sm font-medium">Comissão Total</p>
              <p className="text-2xl font-bold text-emerald-100">{formatCurrency(metrics.comissaoTotal)}</p>
              <p className="text-xs text-emerald-300/80">Todas as vendas</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/30 border border-emerald-400/30">
              <DollarSign className="h-6 w-6 text-emerald-300" />
            </div>
          </div>
        </motion.div>

        {/* Comissão Hoje */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-blue-200/80 text-sm font-medium">Comissão Hoje</p>
              <p className="text-2xl font-bold text-blue-100">{formatCurrency(metrics.comissaoHoje)}</p>
              <p className="text-xs text-blue-300/80">{metrics.totalVendasHoje} vendas</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/30 border border-blue-400/30">
              <Calendar className="h-6 w-6 text-blue-300" />
            </div>
          </div>
        </motion.div>

        {/* Comissão Semana */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-purple-200/80 text-sm font-medium">Comissão Semana</p>
              <p className="text-2xl font-bold text-purple-100">{formatCurrency(metrics.comissaoSemana)}</p>
              <p className="text-xs text-purple-300/80">Esta semana</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/30 border border-purple-400/30">
              <BarChart3 className="h-6 w-6 text-purple-300" />
            </div>
          </div>
        </motion.div>

        {/* Comissão Mês */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-6 hover:border-orange-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-orange-200/80 text-sm font-medium">Comissão Mês</p>
              <p className="text-2xl font-bold text-orange-100">{formatCurrency(metrics.comissaoMes)}</p>
              <div className="flex items-center space-x-1">
                {metrics.crescimentoComissao >= 0 ? (
                  <ArrowUp className="h-3 w-3 text-green-400" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-400" />
                )}
                <p className="text-xs text-orange-300/80">
                  {formatPercentage(metrics.crescimentoComissao)} vs mês anterior
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/30 border border-orange-400/30">
              <TrendingUp className="h-6 w-6 text-orange-300" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Total Usuários */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-cyan-200/80 text-sm font-medium">Saldo Total Usuários</p>
              <p className="text-2xl font-bold text-cyan-100">{formatCurrency(metrics.saldoTotalUsuarios)}</p>
              <p className="text-xs text-cyan-300/80">{metrics.totalUsuarios} usuários</p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/30 border border-cyan-400/30">
              <Wallet className="h-6 w-6 text-cyan-300" />
            </div>
          </div>
        </motion.div>

        {/* Total Usuários */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-sm border border-pink-500/30 rounded-2xl p-6 hover:border-pink-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-pink-200/80 text-sm font-medium">Total Usuários</p>
              <p className="text-2xl font-bold text-pink-100">{metrics.totalUsuarios}</p>
              <div className="flex items-center space-x-1">
                {metrics.crescimentoUsuarios >= 0 ? (
                  <ArrowUp className="h-3 w-3 text-green-400" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-400" />
                )}
                <p className="text-xs text-pink-300/80">
                  {formatPercentage(metrics.crescimentoUsuarios)} vs mês anterior
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-pink-500/30 border border-pink-400/30">
              <Users className="h-6 w-6 text-pink-300" />
            </div>
          </div>
        </motion.div>

        {/* Total MikroTiks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-6 hover:border-indigo-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-indigo-200/80 text-sm font-medium">Total MikroTiks</p>
              <p className="text-2xl font-bold text-indigo-100">{metrics.totalMikrotiks}</p>
              <p className="text-xs text-indigo-300/80">Dispositivos ativos</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/30 border border-indigo-400/30">
              <Router className="h-6 w-6 text-indigo-300" />
            </div>
          </div>
        </motion.div>

        {/* Total Vendas PIX */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-yellow-200/80 text-sm font-medium">Total Vendas PIX</p>
              <p className="text-2xl font-bold text-yellow-100">{metrics.totalVendasPix}</p>
              <p className="text-xs text-yellow-300/80">Vendas completadas</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-500/30 border border-yellow-400/30">
              <CreditCard className="h-6 w-6 text-yellow-300" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Grids de dados detalhados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Usuários por Saldo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Crown className="h-5 w-5 text-yellow-400 mr-2" />
              Top 5 Usuários - Maior Saldo
            </h3>
            <Badge variant="outline" className="text-xs">
              {metrics.topUsuariosSaldo.length} usuários
            </Badge>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {metrics.topUsuariosSaldo.length > 0 ? (
              metrics.topUsuariosSaldo.map((usuario, index) => (
                <div
                  key={usuario.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                      index === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-800' :
                      'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{usuario.nome}</p>
                      <p className="text-xs text-gray-400">{usuario.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(usuario.saldo)}</p>
                    <p className="text-xs text-gray-500">{usuario.total_vendas} vendas</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Usuários com Saque Automático */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Zap className="h-5 w-5 text-yellow-400 mr-2" />
              Saque Automático (≥ R$ 50)
            </h3>
            <Badge variant="outline" className="text-xs">
              {metrics.usuariosSaqueAutomatico.length} usuários
            </Badge>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {metrics.usuariosSaqueAutomatico.length > 0 ? (
              metrics.usuariosSaqueAutomatico.map((usuario) => (
                <div
                  key={usuario.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                      <Zap className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{usuario.nome}</p>
                      <p className="text-xs text-gray-400">{usuario.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-yellow-400">{formatCurrency(usuario.saldo)}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {usuario.total_vendas} vendas
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">Nenhum usuário com saque automático ativo</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Histórico de Vendas PIX Recentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Activity className="h-5 w-5 text-blue-400 mr-2" />
            Histórico de Vendas PIX Recentes
          </h3>
          <Badge variant="outline" className="text-xs">
            {metrics.vendasPixRecentes.length} vendas
          </Badge>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {metrics.vendasPixRecentes.length > 0 ? (
            metrics.vendasPixRecentes.map((venda) => (
              <div
                key={venda.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <CreditCard className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{venda.plano_nome}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>{venda.mikrotik_nome}</span>
                      <span>•</span>
                      <span>{venda.user_nome}</span>
                      <span>•</span>
                      <span>{venda.mac_address}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-400">{formatCurrency(venda.valor_total)}</p>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-emerald-400">Admin: {formatCurrency(venda.valor_admin)}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-purple-400">User: {formatCurrency(venda.valor_usuario)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(venda.created_at)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Nenhuma venda PIX registrada</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
} 