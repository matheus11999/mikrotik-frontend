import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Eye,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Router,
  Activity,
  Crown,
  ArrowUp,
  Zap,
  Sparkles
} from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { PlanoModal } from '../PlanoModal'

interface UserSalesHistory {
  id: string
  valor_total: number
  plano_nome: string
  plano_valor: number
  mac_address: string
  status: string
  created_at: string
  tipo?: string // 'pix' ou 'fisica'
  mikrotik: {
    nome: string
    id: string
  }
}

interface UserStats {
  // Totais gerais
  totalVendas: number
  vendasMes: number
  rendaTotal: number
  rendaMes: number
  
  // Vendas PIX (comissão do usuário)
  vendasPix: {
    total: number
    totalMes: number
    valorTotal: number
    valorMes: number
  }
  
  // Vendas físicas/vouchers (valor total sem comissão)
  vendasFisicas: {
    total: number
    totalMes: number
    valorTotal: number
    valorMes: number
  }
  
  vendasRecentes: UserSalesHistory[]
  topMikroTik: {
    nome: string
    vendas: number
    valor: number
  } | null
}

interface UserSubscription {
  id: string
  plan_id: string
  starts_at: string
  expires_at: string
  status: 'active' | 'expired' | 'cancelled'
  subscription_plans: {
    id: string
    name: string
    description: string
    price: number
    duration_days: number
    features: any
  }
}

interface PlanCardProps {
  className?: string
}

export function UserDashboardWidget() {
  const { user } = useAuthContext()
  const [stats, setStats] = useState<UserStats>({
    totalVendas: 0,
    vendasMes: 0,
    rendaTotal: 0,
    rendaMes: 0,
    vendasPix: {
      total: 0,
      totalMes: 0,
      valorTotal: 0,
      valorMes: 0
    },
    vendasFisicas: {
      total: 0,
      totalMes: 0,
      valorTotal: 0,
      valorMes: 0
    },
    vendasRecentes: [],
    topMikroTik: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserStats()
    }
  }, [user])

  const fetchUserStats = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Data atual e primeiro dia do mês
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Buscar vendas do usuário via historico_vendas 
      console.log('Fetching user sales for user:', user.id)
      
      const { data: historicoVendas, error: vendasError } = await supabase
        .from('historico_vendas')
        .select('id, valor, created_at, status, plano_nome, plano_valor, mac_address, mikrotik_id, tipo, descricao')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('Sales query result:', { historicoVendas, vendasError })

      // Buscar comissões do usuário (vendas PIX)
      const { data: comissoes, error: comissoesError } = await supabase
        .from('comissoes_resumo')
        .select('*')
        .eq('status', 'pago')
        .order('created_at', { ascending: false })

      console.log('Commissions query result:', { comissoes, comissoesError })

      if (vendasError) {
        console.warn('Error fetching sales history, using fallback data:', vendasError)
        // Se der erro na consulta, usar dados vazios para não quebrar a interface
        setStats({
          totalVendas: 0,
          vendasMes: 0,
          rendaTotal: 0,
          rendaMes: 0,
          vendasPix: { total: 0, totalMes: 0, valorTotal: 0, valorMes: 0 },
          vendasFisicas: { total: 0, totalMes: 0, valorTotal: 0, valorMes: 0 },
          vendasRecentes: [],
          topMikroTik: null
        })
        return
      }

      // Buscar informações dos MikroTiks para as vendas
      const mikrotikIds = [...new Set(historicoVendas?.map(h => h.mikrotik_id).filter(Boolean))]
      console.log('MikroTik IDs to fetch:', mikrotikIds)
      
      let mikrotiks: { id: string; nome: string }[] = []
      if (mikrotikIds.length > 0) {
        const { data: mikrotiksData, error: mikrotiksError } = await supabase
          .from('mikrotiks')
          .select('id, nome')
          .in('id', mikrotikIds)
        
        console.log('MikroTiks query result:', { mikrotiksData, mikrotiksError })
        mikrotiks = mikrotiksData || []
      }

      const mikrotikMap = mikrotiks?.reduce((acc: Record<string, { id: string; nome: string }>, m) => {
        acc[m.id] = m
        return acc
      }, {} as Record<string, { id: string; nome: string }>) || {}

      // Separar vendas PIX (comissões) e físicas (vouchers)
      const vendasPixData = comissoes?.filter(c => c.mikrotik_nome) || []
      const vendasFisicasData = historicoVendas?.filter(h => 
        h.tipo !== 'usuario' && (h.descricao?.includes('voucher') || h.descricao?.includes('fisica'))
      ) || []
      
      // Calcular estatísticas PIX (comissões do usuário)
      const vendasPix = {
        total: vendasPixData.length,
        totalMes: vendasPixData.filter(v => new Date(v.created_at) >= firstDayOfMonth).length,
        valorTotal: vendasPixData.reduce((sum, v) => sum + (v.valor || 0), 0),
        valorMes: vendasPixData.filter(v => new Date(v.created_at) >= firstDayOfMonth)
          .reduce((sum, v) => sum + (v.valor || 0), 0)
      }
      
      // Calcular estatísticas vendas físicas (valor total sem comissão)
      const vendasFisicas = {
        total: vendasFisicasData.length,
        totalMes: vendasFisicasData.filter(v => new Date(v.created_at) >= firstDayOfMonth).length,
        valorTotal: vendasFisicasData.reduce((sum, v) => sum + (v.plano_valor || v.valor || 0), 0),
        valorMes: vendasFisicasData.filter(v => new Date(v.created_at) >= firstDayOfMonth)
          .reduce((sum, v) => sum + (v.plano_valor || v.valor || 0), 0)
      }

      // Totais gerais (principalmente comissões para o usuário)
      const totalVendas = vendasPix.total
      const vendasMes = vendasPix.totalMes
      const rendaTotal = vendasPix.valorTotal
      const rendaMes = vendasPix.valorMes

      // Top MikroTik
      const mikrotikStats = historicoVendas?.reduce((acc, historico) => {
        const mikrotikId = historico.mikrotik_id
        const mikrotik = mikrotikMap[mikrotikId]
        const mikrotikNome = mikrotik?.nome || 'MikroTik'
        
        if (mikrotikId) {
          if (!acc[mikrotikId]) {
            acc[mikrotikId] = {
              nome: mikrotikNome,
              vendas: 0,
              valor: 0
            }
          }
          acc[mikrotikId].vendas += 1
          acc[mikrotikId].valor += historico.valor || 0
        }
        return acc
      }, {} as Record<string, { nome: string; vendas: number; valor: number }>)

      const topMikroTik = Object.values(mikrotikStats || {})
        .sort((a, b) => b.vendas - a.vendas)[0] || null

      // Processar vendas recentes (combinando PIX e físicas)
      const vendasPixRecentes = vendasPixData.slice(0, 3).map(v => ({
        id: v.id || v.payment_id,
        valor_total: v.valor,
        plano_nome: v.plano_nome || 'Plano PIX',
        plano_valor: v.valor,
        mac_address: v.mac_address || '',
        status: 'pago',
        created_at: v.created_at,
        tipo: 'pix',
        mikrotik: { nome: v.mikrotik_nome || 'MikroTik', id: '' }
      }))
      
      const vendasFisicasRecentes = vendasFisicasData.slice(0, 3).map(v => ({
        id: v.id,
        valor_total: v.plano_valor || v.valor,
        plano_nome: v.plano_nome || 'Voucher Físico',
        plano_valor: v.plano_valor || v.valor,
        mac_address: v.mac_address || '',
        status: v.status || 'pago',
        created_at: v.created_at,
        tipo: 'fisica',
        mikrotik: mikrotikMap[v.mikrotik_id] || { nome: 'MikroTik', id: '' }
      }))

      // Combinar e ordenar por data
      const vendasRecentes = [...vendasPixRecentes, ...vendasFisicasRecentes]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      setStats({
        totalVendas,
        vendasMes,
        rendaTotal,
        rendaMes,
        vendasPix,
        vendasFisicas,
        vendasRecentes,
        topMikroTik
      })

    } catch (error) {
      console.error('Error fetching user stats:', error)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/10'
      case 'pending': return 'text-yellow-400 bg-yellow-500/10'
      case 'failed': return 'text-red-400 bg-red-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />
      case 'pending': return <Clock className="h-3 w-3" />
      case 'failed': return <XCircle className="h-3 w-3" />
      default: return <Activity className="h-3 w-3" />
    }
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
        <div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700/30 rounded mb-4 w-48"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-700/30 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Total (primeiro lugar) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200/80 text-sm font-medium">Saldo Atual</p>
              <p className="text-2xl font-bold text-green-100">{formatCurrency(user?.saldo || 0)}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/30 border border-green-400/30">
              <DollarSign className="h-6 w-6 text-green-300" />
            </div>
          </div>
        </motion.div>

        {/* Vendas PIX (Comissões) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-blue-200/80 text-sm font-medium">Vendas PIX</p>
              <p className="text-2xl font-bold text-blue-100">{formatCurrency(stats.vendasPix.valorTotal)}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/30 border border-blue-400/30">
              <TrendingUp className="h-6 w-6 text-blue-300" />
            </div>
          </div>
          <div className="text-xs text-blue-300/70">
            {stats.vendasPix.total} vendas • {formatCurrency(stats.vendasPix.valorMes)} este mês
          </div>
        </motion.div>

        {/* Vendas Físicas (Vouchers) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-purple-200/80 text-sm font-medium">Vendas Físicas</p>
              <p className="text-2xl font-bold text-purple-100">{formatCurrency(stats.vendasFisicas.valorTotal)}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/30 border border-purple-400/30">
              <ShoppingCart className="h-6 w-6 text-purple-300" />
            </div>
          </div>
          <div className="text-xs text-purple-300/70">
            {stats.vendasFisicas.total} vouchers • {formatCurrency(stats.vendasFisicas.valorMes)} este mês
          </div>
        </motion.div>

        {/* Comissões do Mês */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-gray-400 text-sm font-medium">Comissões do Mês</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.vendasPix.valorMes)}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Calendar className="h-6 w-6 text-orange-400" />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {stats.vendasPix.totalMes} vendas PIX este mês
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas Recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Vendas Recentes
            </h3>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors">
              Ver todas
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {stats.vendasRecentes.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma venda realizada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.vendasRecentes.map((venda, index) => (
                <motion.div
                  key={venda.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 rounded-lg bg-gray-900/50 border border-gray-800/50 hover:border-gray-700 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Router className="h-4 w-4 text-blue-400" />
                        <p className="text-white font-medium text-sm truncate">
                          {venda.mikrotik?.nome || 'MikroTik'}
                        </p>
                        {venda.tipo && (
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            venda.tipo === 'pix' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          )}>
                            {venda.tipo === 'pix' ? '💳' : '🎫'}
                            <span className="capitalize">{venda.tipo === 'pix' ? 'PIX' : 'Voucher'}</span>
                          </div>
                        )}
                        <div className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          getStatusColor(venda.status)
                        )}>
                          {getStatusIcon(venda.status)}
                          <span className="capitalize">{venda.status}</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mb-1">
                        {venda.plano_nome} • {formatDate(venda.created_at)}
                      </p>
                      <p className="text-gray-500 text-xs font-mono">
                        {venda.mac_address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">
                        {formatCurrency(venda.valor_total)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top MikroTik */}
        <div className="space-y-6">
          {/* Top MikroTik */}
          {stats.topMikroTik && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Router className="h-5 w-5 text-purple-400" />
                Top MikroTik
              </h3>
              
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{stats.topMikroTik.nome}</p>
                    <p className="text-gray-400 text-sm">
                      {stats.topMikroTik.vendas} vendas realizadas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-bold">
                      {formatCurrency(stats.topMikroTik.valor)}
                    </p>
                    <p className="text-gray-400 text-xs">Total gerado</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export function UserSubscriptionCard({ className }: PlanCardProps) {
  const { user } = useAuthContext()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Debug logs for modal state
  useEffect(() => {
    console.log('UserSubscriptionCard: showUpgradeModal changed to:', showUpgradeModal)
  }, [showUpgradeModal])

  useEffect(() => {
    if (user) {
      fetchUserSubscription()
    }
  }, [user])

  const fetchUserSubscription = async () => {
    try {
      console.log('Fetching subscription for user:', user?.id)
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans (*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      console.log('Subscription query result:', { data, error })

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching subscription, using fallback:', error)
        setSubscription(null)
        setLoading(false)
        return
      }

      // Se encontrou dados, pega o primeiro (mais recente)
      setSubscription(data && data.length > 0 ? data[0] : null)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = () => {
    if (!subscription) return 0
    const now = new Date()
    const expires = new Date(subscription.expires_at)
    const diffTime = expires.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const isNearExpiration = () => {
    const daysRemaining = getDaysRemaining()
    return daysRemaining <= 3 && daysRemaining > 0
  }

  const isTrialPlan = () => {
    return subscription?.subscription_plans?.name === 'Teste Grátis'
  }

  const handleOpenModal = () => {
    console.log('handleOpenModal called - current state:', showUpgradeModal)
    console.log('Setting showUpgradeModal to true')
    setShowUpgradeModal(true)
    console.log('showUpgradeModal set, should be true now')
    
    // Force re-render verification
    setTimeout(() => {
      console.log('After timeout - showUpgradeModal is:', showUpgradeModal)
    }, 100)
  }

  const handleCloseModal = () => {
    console.log('handleCloseModal called')
    setShowUpgradeModal(false)
  }

  if (loading) {
    return (
      <div className={`bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 animate-pulse ${className}`}>
        <div className="h-6 bg-gray-700 rounded mb-4"></div>
        <div className="h-4 bg-gray-700 rounded mb-2"></div>
        <div className="h-4 bg-gray-700 rounded"></div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <>
        <div className={`bg-black/40 backdrop-blur-sm border border-red-500/20 rounded-2xl p-4 ${className}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <Crown className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Sem Plano Ativo</h3>
              <p className="text-xs text-gray-400">Ative um plano para continuar</p>
            </div>
          </div>
          <Button 
            onClick={handleOpenModal}
            className="w-full bg-red-600 hover:bg-red-700 text-sm py-2"
          >
            Ativar Plano
          </Button>
        </div>

        {/* Modal de Planos */}
        {showUpgradeModal && (
          <PlanoModal
            isOpen={showUpgradeModal}
            onClose={handleCloseModal}
            currentPlan={null}
          />
        )}
      </>
    )
  }

  const daysRemaining = getDaysRemaining()
  const plan = subscription.subscription_plans

  return (
    <>
      <div className={`bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              isTrialPlan() 
                ? 'bg-yellow-500/10 border-yellow-500/20' 
                : 'bg-purple-500/10 border-purple-500/20'
            }`}>
              {isTrialPlan() ? (
                <Sparkles className="h-4 w-4 text-yellow-400" />
              ) : (
                <Crown className="h-4 w-4 text-purple-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Plano: {plan.name}</h3>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className={`text-xs font-medium ${
                  daysRemaining <= 3 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Expirado'}
                </span>
              </div>
            </div>
          </div>
          
          {daysRemaining <= 0 ? (
            <Badge variant="destructive" className="border-red-500/20">
              <Clock className="h-3 w-3 mr-1" />
              Expirado
            </Badge>
          ) : daysRemaining <= 3 ? (
            <Badge variant="destructive" className="border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
              <Clock className="h-3 w-3 mr-1" />
              Expira em breve
            </Badge>
          ) : (
            <Badge variant="default" className="border-green-500/20 bg-green-500/10 text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progresso do plano</span>
            <span>{Math.round(((plan.duration_days - daysRemaining) / plan.duration_days) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                daysRemaining <= 3 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ 
                width: `${Math.min(100, ((plan.duration_days - daysRemaining) / plan.duration_days) * 100)}%` 
              }}
            />
          </div>
        </div>

        {/* Features Preview */}
        {plan.features && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {plan.features.vendas_comissao && (
                <Badge variant="outline" className="text-xs py-0.5 px-2">
                  {plan.features.vendas_comissao}% nas vendas
                </Badge>
              )}
              {plan.features.relatorios && (
                <Badge variant="outline" className="text-xs py-0.5 px-2">
                  Relatórios
                </Badge>
              )}
              {plan.features.customizacao && (
                <Badge variant="outline" className="text-xs py-0.5 px-2">
                  Customização
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Button */}
        {(isTrialPlan() || isNearExpiration()) && (
          <Button 
            onClick={handleOpenModal}
            className={`w-full flex items-center gap-2 text-sm py-2 ${
              isTrialPlan() 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {isTrialPlan() ? (
              <>
                <ArrowUp className="h-3 w-3" />
                Fazer Upgrade
              </>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                Renovar Plano
              </>
            )}
          </Button>
        )}
      </div>

      {/* Modal de Upgrade */}
      {showUpgradeModal && (
        <PlanoModal
          isOpen={showUpgradeModal}
          onClose={handleCloseModal}
          currentPlan={null}
        />
      )}
    </>
  )
}