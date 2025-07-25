import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import type { User, Venda, Transacao } from '../../types'
import {
  DollarSign,
  TrendingUp,
  Users,
  Router,
  Activity,
  BarChart3,
  ShoppingCart,
  CreditCard,
  Wallet,
  ChartArea,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock4,
  UserCheck,
  ArrowUp,
  ArrowDown,
  Zap,
  Globe,
  Shield,
  TrendingDown,
  Eye,
  Target,
  AlertTriangle,
  Calendar,
  PieChart,
  Network,
  Database,
  Cpu,
  HardDrive,
  Gauge,
  Sparkles
} from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { DashboardLoading } from '../../components/ui'
import { UserDashboardWidget } from '../../components/dashboard/UserDashboardWidget'
import { AdminDashboardWidget } from '../../components/dashboard/AdminDashboardWidget'
import { PlanStatusBanner } from '../../components/PlanRestrictedRoute'
import { cn } from '../../lib/utils'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PlanoModal } from '../../components/PlanoModal'
import { Button } from '../../components/ui/button'

interface DashboardStats {
  // Estatísticas gerais
  totalVendas: number
  totalVendasHoje: number
  saldoTotal: number
  totalUsuarios: number
  totalMikrotiks: number
  
  // Top rankings (admin)
  topUsuarios?: Array<{
    user: User
    saldo: number
    vendas_count: number
    vendas_valor: number
  }>
  
  // Usuários com saque automático ativado e saldo >= 50
  usuariosSaqueAutomatico?: Array<{
    id: string
    nome: string
    email: string
    saldo: number
    saque_automatico: boolean
  }>
  
  // Histórico de transações
  transacoesRecentes: Transacao[]
  
  // Vendas recentes
  vendasRecentes: Array<{
    id: string
    valor_total: number
    status: string
    created_at: string
    mikrotik?: { nome: string }
    user?: { nome: string }
  }>
  
  // Estatísticas específicas do usuário
  minhasVendas?: number
  minhasVendasHoje?: number
  meuSaldo?: number
  minhasTransacoes?: Transacao[]
  
  // Métricas de performance
  vendas30Dias: number
  vendasMensais: number
  
  // Estatísticas de pagamento
  paymentStats?: {
    total: number
    approved: number
    pending: number
    rejected: number
    successRate: number
    totalValue: number
  }
  
  // Estatísticas de MikroTiks
  mikrotikStats?: Array<{
    id: string
    nome: string
    ip: string
    ativo: boolean
    total_vendas: number
    porcentagem: number
    created_at: string
  }>
  
  // Logs de criação de usuários
  userCreationLogs?: Array<{
    id: string
    status: string
    created_at: string
    mikrotik_id: string
    attempt_number: number
  }>
  
  // Estatísticas dos planos
  planStats?: Array<{
    id: string
    nome: string
    valor: number
    vendas_count: number
    receita_total: number
  }>

  // Atividade recente
  recentActivity?: Array<{
    id: string
    type: 'venda' | 'transacao' | 'user_creation' | 'payment' | 'saque'
    description: string
    timestamp: string
    status: 'success' | 'failed' | 'pending'
    value?: number
  }>
}


// Componente de Card Estatística
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  description,
  color = 'blue',
  loading = false,
  subtitle,
  onClick
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  description?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'cyan' | 'emerald'
  loading?: boolean
  subtitle?: string
  onClick?: () => void
}) => {
  const colorConfig = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400',
    green: 'from-green-500/10 to-green-600/5 border-green-500/20 text-green-400',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-400',
    yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400',
    cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400'
  }

  const config = colorConfig[color]
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Activity

  return (
    <div
      className={cn(
        "relative bg-black/40 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl",
        `bg-gradient-to-br ${config} border`,
        onClick && "cursor-pointer hover:scale-[1.02]",
        loading && "animate-pulse"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${config}`}>
          <Icon className="h-6 w-6" />
        </div>
        
        {trend && trendValue && (
          <div className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border",
            trend === 'up' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            trend === 'down' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            'bg-gray-500/20 text-gray-400 border-gray-500/30'
          )}>
            <TrendIcon className="h-3 w-3" />
            {trendValue}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
          {subtitle && (
            <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
              {subtitle}
            </span>
          )}
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-700/30 rounded animate-pulse" />
            <div className="h-3 bg-gray-700/20 rounded w-2/3 animate-pulse" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-gray-400">{description}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Componente de Tabela de MikroTiks
const MikrotikTable = ({ mikrotiks, loading }: { mikrotiks?: DashboardStats['mikrotikStats'], loading: boolean }) => (
  <div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
        <Router className="h-5 w-5 text-orange-400" />
      </div>
      <h3 className="text-xl font-bold text-white">MikroTiks</h3>
    </div>
    
    {loading ? (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-800/30 rounded-xl animate-pulse" />
        ))}
      </div>
    ) : (
      <div className="space-y-3">
        {mikrotiks?.slice(0, 6).map((mikrotik, index) => (
          <div 
            key={mikrotik.id}
            className="flex items-center justify-between p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${
                mikrotik.ativo ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'
              }`} />
              <div>
                <p className="font-medium text-white text-sm">{mikrotik.nome}</p>
                <p className="text-xs text-gray-400">{mikrotik.ip}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-400 text-sm">
                {mikrotik.porcentagem}%
              </p>
              <p className="text-xs text-gray-400">
                {new Date(mikrotik.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

// Componente de Atividade Recente
const RecentActivity = ({ activities, loading }: { activities?: DashboardStats['recentActivity'], loading: boolean }) => (
  <div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
          <Activity className="h-5 w-5 text-cyan-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Atividade Recente</h3>
      </div>
    </div>
    
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-gray-800/30 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-800/30 rounded animate-pulse" />
                <div className="h-3 bg-gray-800/20 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        activities?.slice(0, 8).map((item, index) => {
          const typeConfig = {
            venda: { icon: ShoppingCart, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
            transacao: { icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            user_creation: { icon: UserCheck, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            payment: { icon: DollarSign, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            saque: { icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
          }
          
          const config = typeConfig[item.type] || typeConfig.venda
          const IconComponent = config.icon
          
          return (
            <div 
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200"
            >
              <div className={`p-3 rounded-full ${config.bg} ${config.border} border`}>
                <IconComponent className={`h-4 w-4 ${config.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm leading-tight">
                  {item.description}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Clock4 className="h-3 w-3" />
                  {new Date(item.timestamp).toLocaleString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {item.value && (
                  <span className="text-sm font-medium text-green-400">
                    {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                )}
                <div className={`w-3 h-3 rounded-full ${
                  item.status === 'success' ? 'bg-green-400' :
                  item.status === 'failed' ? 'bg-red-400' :
                  'bg-yellow-400'
                }`} />
              </div>
            </div>
          )
        })
      )}
    </div>
  </div>
)





export function DashboardFinal() {
  const { user } = useAuthContext()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [user])

  const fetchDashboardStats = async () => {
    if (!user) return

    try {
      setRefreshing(true)
      if (stats === null) setLoading(true)

      if (user.role === 'admin') {
        // Buscar dados reais do admin
        const [
          usersResult,
          mikrotiksResult,
          vendasResult,
          vendasHojeResult,
          topUsersResult,
          transacoesResult,
          vendasRecentesResult,
          vendas30DiasResult,
          paymentsResult,
          planosResult,
          userCreationLogsResult,
          usuariosSaqueAutomaticoResult
        ] = await Promise.all([
          // Total de usuários
          supabase.from('users').select('id, saldo').eq('role', 'user'),
          
          // MikroTiks
          supabase.from('mikrotiks').select('*'),
          
          // Total de vendas
          supabase.from('vendas').select('valor_total').eq('status', 'completed'),
          
          // Vendas de hoje
          supabase.from('vendas')
            .select('valor_total')
            .eq('status', 'completed')
            .gte('created_at', new Date().toISOString().split('T')[0]),
          
          // Top usuários
          supabase.from('users')
            .select('id, nome, email, saldo')
            .eq('role', 'user')
            .order('saldo', { ascending: false })
            .limit(10),
          
          // Transações recentes
          supabase.from('transacoes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20),
          
          // Vendas recentes
          supabase.from('vendas')
            .select(`
              id, valor_total, status, created_at,
              mikrotik:mikrotiks(nome),
              user:users(nome)
            `)
            .order('created_at', { ascending: false })
            .limit(20),
          
          // Vendas dos últimos 30 dias
          supabase.from('vendas')
            .select('valor_total')
            .eq('status', 'completed')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

          // Estatísticas de pagamentos
          supabase.from('payments')
            .select('payment_status, amount'),

          // Planos
          supabase.from('planos')
            .select('*'),

          // Logs de criação de usuários
          supabase.from('mikrotik_user_creation_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),

          // Usuários com saque automático ativado e saldo >= 50
          supabase.from('users')
            .select('id, nome, email, saldo, saque_automatico')
            .eq('role', 'user')
            .eq('saque_automatico', true)
            .gte('saldo', 50)
        ])

        const totalVendas = vendasResult.data?.reduce((sum, v) => sum + (v.valor_total || 0), 0) || 0
        const totalVendasHoje = vendasHojeResult.data?.reduce((sum, v) => sum + (v.valor_total || 0), 0) || 0
        const saldoTotal = usersResult.data?.reduce((sum, u) => sum + (u.saldo || 0), 0) || 0
        const vendas30Dias = vendas30DiasResult.data?.reduce((sum, v) => sum + (v.valor_total || 0), 0) || 0

        // Estatísticas de pagamento
        const payments = paymentsResult.data || []
        const paymentStats = {
          total: payments.length,
          approved: payments.filter(p => p.payment_status === 'approved').length,
          pending: payments.filter(p => p.payment_status === 'pending').length,
          rejected: payments.filter(p => ['rejected', 'cancelled'].includes(p.payment_status)).length,
          successRate: payments.length > 0 ? (payments.filter(p => p.payment_status === 'approved').length / payments.length * 100) : 0,
          totalValue: payments.filter(p => p.payment_status === 'approved').reduce((sum, p) => sum + (p.amount || 0), 0)
        }

        // Processar top usuários
        const topUsuarios = topUsersResult.data?.map(u => ({
          user: {
            id: u.id,
            nome: u.nome,
            email: u.email,
            role: 'user' as const,
            saldo: u.saldo || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as User,
          saldo: u.saldo || 0,
          vendas_count: 0, // Calculado separadamente se necessário
          vendas_valor: 0 // Calculado separadamente se necessário
        })) || []

        // Atividade recente
        const recentActivity = [
          ...vendasRecentesResult.data?.slice(0, 3).map(v => ({
            id: v.id,
            type: 'venda' as const,
            description: `Nova venda - ${(v as any).mikrotik?.nome || 'MikroTik'}`,
            timestamp: v.created_at,
            status: v.status === 'completed' ? 'success' as const : 'pending' as const,
            value: v.valor_total
          })) || [],
          ...transacoesResult.data?.slice(0, 3).map(t => ({
            id: t.id,
            type: 'transacao' as const,
            description: t.motivo || 'Transação processada',
            timestamp: t.created_at,
            status: 'success' as const,
            value: t.valor
          })) || [],
          ...userCreationLogsResult.data?.slice(0, 2).map(log => ({
            id: log.id,
            type: 'user_creation' as const,
            description: `Usuário ${log.status === 'success' ? 'criado' : 'falhou'} no MikroTik`,
            timestamp: log.created_at,
            status: log.status as 'success' | 'failed'
          })) || []
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        setStats({
          totalVendas,
          totalVendasHoje,
          saldoTotal,
          totalUsuarios: usersResult.data?.length || 0,
          totalMikrotiks: mikrotiksResult.data?.length || 0,
          topUsuarios,
          usuariosSaqueAutomatico: usuariosSaqueAutomaticoResult.data || [],
          transacoesRecentes: transacoesResult.data || [],
          vendasRecentes: vendasRecentesResult.data?.map(v => ({
            id: v.id,
            valor_total: v.valor_total,
            status: v.status,
            created_at: v.created_at,
            mikrotik: (v as any).mikrotik,
            user: (v as any).user
          })) || [],
          vendas30Dias,
          vendasMensais: vendas30Dias,
          paymentStats,
          mikrotikStats: mikrotiksResult.data || [],
          recentActivity
        })
      } else {
        // Dados para usuário regular
        const [
          minhasVendasResult,
          minhasVendasHojeResult,
          minhasTransacoesResult,
          minhasVendasRecentesResult,
          minhasVendas30DiasResult
        ] = await Promise.all([
          // Minhas vendas via historico_vendas
          supabase.from('historico_vendas')
            .select('valor')
            .eq('user_id', user.id)
            .eq('tipo', 'usuario'),
          
          // Minhas vendas de hoje
          supabase.from('historico_vendas')
            .select('valor')
            .eq('user_id', user.id)
            .eq('tipo', 'usuario')
            .gte('created_at', new Date().toISOString().split('T')[0]),
          
          // Minhas transações
          supabase.from('transacoes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          
          // Minhas vendas recentes
          supabase.from('historico_vendas')
            .select(`
              id, valor, created_at,
              venda:vendas(status, mikrotik:mikrotiks(nome))
            `)
            .eq('user_id', user.id)
            .eq('tipo', 'usuario')
            .order('created_at', { ascending: false })
            .limit(10),
          
          // Minhas vendas dos últimos 30 dias
          supabase.from('historico_vendas')
            .select('valor')
            .eq('user_id', user.id)
            .eq('tipo', 'usuario')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        ])

        const minhasVendas = minhasVendasResult.data?.reduce((sum, v) => sum + (v.valor || 0), 0) || 0
        const minhasVendasHoje = minhasVendasHojeResult.data?.reduce((sum, v) => sum + (v.valor || 0), 0) || 0
        const minhasVendas30Dias = minhasVendas30DiasResult.data?.reduce((sum, v) => sum + (v.valor || 0), 0) || 0

        const recentActivity = [
          ...minhasVendasRecentesResult.data?.slice(0, 5).map(v => ({
            id: v.id,
            type: 'venda' as const,
            description: `Venda realizada - ${(v as any).venda?.mikrotik?.nome || 'MikroTik'}`,
            timestamp: v.created_at,
            status: 'success' as const,
            value: v.valor
          })) || [],
          ...minhasTransacoesResult.data?.slice(0, 5).map(t => ({
            id: t.id,
            type: 'transacao' as const,
            description: t.motivo || 'Transação processada',
            timestamp: t.created_at,
            status: 'success' as const,
            value: t.valor
          })) || []
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        setStats({
          totalVendas: 0,
          totalVendasHoje: 0,
          saldoTotal: 0,
          totalUsuarios: 0,
          totalMikrotiks: 0,
          minhasVendas,
          minhasVendasHoje,
          meuSaldo: user.saldo,
          minhasTransacoes: minhasTransacoesResult.data || [],
          transacoesRecentes: minhasTransacoesResult.data || [],
          vendasRecentes: minhasVendasRecentesResult.data?.map(v => ({
            id: v.id,
            valor_total: v.valor,
            status: (v as any).venda?.status || 'completed',
            created_at: v.created_at,
            mikrotik: (v as any).venda?.mikrotik
          })) || [],
          vendas30Dias: minhasVendas30Dias,
          vendasMensais: minhasVendas30Dias,
          recentActivity
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const isAdmin = user?.role === 'admin'

  if (loading) {
    return <DashboardLoading isLoading={loading} message="Carregando dados do dashboard..." />
  }

  return (
    <div className="min-h-screen bg-black pt-16 lg:pt-0">
      {/* Header - Apenas para usuários normais */}
      {!isAdmin && (
        <div className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm sticky top-0 lg:top-0 z-40">
          <div className="px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Meu Dashboard
                  </h1>
                  <p className="text-gray-400">
                    Suas estatísticas pessoais
                  </p>
                </div>
              </div>
              
              <button 
                onClick={fetchDashboardStats}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 hover:scale-105"
              >
                {refreshing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-6">
        <div className="space-y-6">
          {/* Plan Status Banner - Mostra status do plano para usuários comuns */}
          {!isAdmin && <PlanStatusBanner />}
          


          {/* Main Content */}
          {isAdmin ? (
            <div className="space-y-8">
              {/* Admin Dashboard Widget */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <AdminDashboardWidget />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Main Dashboard Content */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <UserDashboardWidget />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Floating Button - Only for regular users */}
      {!isAdmin && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5, type: "spring" }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
        >
          <a
            href="https://wa.me/5597981014774"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-full shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300"
            title="Falar no WhatsApp"
          >
            <svg 
              className="w-6 h-6" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
            </svg>
          </a>
        </motion.div>
      )}
    </div>
  )
}