import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
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
  senha?: string // Para vouchers físicos
  mikrotik: {
    nome: string
    id: string
  }
}

interface UserStats {
  // Totais gerais
  totalVendas: number
  vendasDia: number
  vendasMes: number
  rendaTotal: number
  rendaDia: number
  rendaMes: number
  
  // Saldo do usuário do banco de dados
  saldoAtual: number
  
  // Vendas PIX (comissão do usuário)
  vendasPix: {
    total: number
    totalDia: number
    totalMes: number
    valorTotal: number
    valorDia: number
    valorMes: number
  }
  
  // Vendas físicas/vouchers (valor total sem comissão)
  vendasFisicas: {
    total: number
    totalDia: number
    totalMes: number
    valorTotal: number
    valorDia: number
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
    vendasDia: 0,
    vendasMes: 0,
    rendaTotal: 0,
    rendaDia: 0,
    rendaMes: 0,
    saldoAtual: 0,
    vendasPix: {
      total: 0,
      totalDia: 0,
      totalMes: 0,
      valorTotal: 0,
      valorDia: 0,
      valorMes: 0
    },
    vendasFisicas: {
      total: 0,
      totalDia: 0,
      totalMes: 0,
      valorTotal: 0,
      valorDia: 0,
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

      // Data atual, primeiro dia do mês e início do dia atual
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Buscar MikroTiks do usuário primeiro
      const { data: userMikrotiks, error: mikrotiksError } = await supabase
        .from('mikrotiks')
        .select('id, nome')
        .eq('user_id', user.id)

      if (mikrotiksError) {
        console.warn('Error fetching user mikrotiks:', mikrotiksError)
        return
      }

      const userMikrotikIds = userMikrotiks?.map(m => m.id) || []
      console.log('User MikroTik IDs:', userMikrotikIds)

      if (userMikrotikIds.length === 0) {
        console.log('User has no MikroTiks, using empty data')
        // Buscar saldo do usuário mesmo sem MikroTiks
        const { data: userData } = await supabase
          .from('users')
          .select('saldo')
          .eq('id', user.id)
          .single()
        
        setStats({
          totalVendas: 0,
          vendasDia: 0,
          vendasMes: 0,
          rendaTotal: 0,
          rendaDia: 0,
          rendaMes: 0,
          saldoAtual: userData?.saldo || 0,
          vendasPix: { total: 0, totalDia: 0, totalMes: 0, valorTotal: 0, valorDia: 0, valorMes: 0 },
          vendasFisicas: { total: 0, totalDia: 0, totalMes: 0, valorTotal: 0, valorDia: 0, valorMes: 0 },
          vendasRecentes: [],
          topMikroTik: null
        })
        return
      }

      // Buscar vendas PIX via tabela vendas_pix (comissões do usuário)
      const { data: vendasPixFromDB, error: vendasPixError } = await supabase
        .from('vendas_pix')
        .select(`
          id, payment_id, valor_total, valor_usuario, valor_admin,
          mac_address, created_at, status, mikrotik_id,
          plano_nome, plano_valor
        `)
        .in('mikrotik_id', userMikrotikIds)
        .eq('status', 'completed')
        .not('mercadopago_payment_id', 'is', null)
        .order('created_at', { ascending: false })

      // Buscar vouchers físicos via tabela voucher
      const { data: vouchersData, error: vouchersError } = await supabase
        .from('voucher')
        .select('id, valor_venda, nome_plano, created_at, mac_address, mikrotik_id, tipo_voucher, senha')
        .in('mikrotik_id', userMikrotikIds)
        .eq('tipo_voucher', 'fisico')
        .order('created_at', { ascending: false })

      // Criar mapa de MikroTiks
      const mikrotikMap = userMikrotiks?.reduce((acc: Record<string, { id: string; nome: string }>, m) => {
        acc[m.id] = m
        return acc
      }, {} as Record<string, { id: string; nome: string }>) || {}

      // Preparar dados das vendas PIX (apenas para relatório, sem comissão)
      const vendasPixData = (vendasPixFromDB || [])
        .filter(v => v.valor_usuario > 0) // Filtrar apenas vendas que realmente geram comissão
        .map(v => ({
          id: v.id,
          valor: v.valor_usuario, // Comissão do usuário (se houver)
          created_at: v.created_at,
          plano_nome: v.plano_nome || 'Plano PIX',
          plano_valor: v.valor_total,
          mac_address: v.mac_address,
          mikrotik_id: v.mikrotik_id,
          status: v.status,
          tipo: 'pix'
        }))
      
      // Preparar dados das vendas físicas (vouchers da tabela voucher)
      const vendasFisicasData = (vouchersData || []).map(v => ({
        id: v.id,
        valor: v.valor_venda,
        created_at: v.created_at,
        plano_nome: v.nome_plano,
        plano_valor: v.valor_venda,
        mac_address: v.mac_address,
        mikrotik_id: v.mikrotik_id,
        status: 'completed',
        tipo: 'fisica',
        senha: v.senha
      }))
      
      // Calcular estatísticas PIX (comissões do usuário)
      const vendasPix = {
        total: vendasPixData.length,
        totalDia: vendasPixData.filter(v => new Date(v.created_at) >= startOfToday).length,
        totalMes: vendasPixData.filter(v => new Date(v.created_at) >= firstDayOfMonth).length,
        valorTotal: vendasPixData.reduce((sum, v) => sum + (v.valor || 0), 0),
        valorDia: vendasPixData.filter(v => new Date(v.created_at) >= startOfToday)
          .reduce((sum, v) => sum + (v.valor || 0), 0),
        valorMes: vendasPixData.filter(v => new Date(v.created_at) >= firstDayOfMonth)
          .reduce((sum, v) => sum + (v.valor || 0), 0)
      }
      
      // Calcular estatísticas vendas físicas (valor total sem comissão)
      const vendasFisicas = {
        total: vendasFisicasData.length,
        totalDia: vendasFisicasData.filter(v => new Date(v.created_at) >= startOfToday).length,
        totalMes: vendasFisicasData.filter(v => new Date(v.created_at) >= firstDayOfMonth).length,
        valorTotal: vendasFisicasData.reduce((sum, v) => sum + (v.plano_valor || v.valor || 0), 0),
        valorDia: vendasFisicasData.filter(v => new Date(v.created_at) >= startOfToday)
          .reduce((sum, v) => sum + (v.plano_valor || v.valor || 0), 0),
        valorMes: vendasFisicasData.filter(v => new Date(v.created_at) >= firstDayOfMonth)
          .reduce((sum, v) => sum + (v.plano_valor || v.valor || 0), 0)
      }

      // Totais gerais (apenas comissões PIX para o usuário - vouchers são só relatório)
      const totalVendas = vendasPix.total + vendasFisicas.total // Total de vendas para estatística
      const vendasDia = vendasPix.totalDia + vendasFisicas.totalDia // Total do dia para estatística  
      const vendasMes = vendasPix.totalMes + vendasFisicas.totalMes // Total do mês para estatística
      const rendaTotal = vendasPix.valorTotal // Receita real = só comissões PIX
      const rendaDia = vendasPix.valorDia // Receita do dia = só comissões PIX
      const rendaMes = vendasPix.valorMes // Receita do mês = só comissões PIX

      // Top MikroTik - combinando PIX e físicas
      const mikrotikStats: Record<string, { nome: string; vendas: number; valor: number }> = {}
      
      // Processar vendas PIX
      vendasPixData.forEach(venda => {
        if (venda.mikrotik_id) {
          if (!mikrotikStats[venda.mikrotik_id]) {
            mikrotikStats[venda.mikrotik_id] = {
              nome: mikrotikMap[venda.mikrotik_id]?.nome || 'MikroTik',
              vendas: 0,
              valor: 0
            }
          }
          mikrotikStats[venda.mikrotik_id].vendas += 1
          mikrotikStats[venda.mikrotik_id].valor += venda.valor || 0
        }
      })

      // Processar vendas físicas
      vendasFisicasData.forEach(venda => {
        if (venda.mikrotik_id) {
          if (!mikrotikStats[venda.mikrotik_id]) {
            mikrotikStats[venda.mikrotik_id] = {
              nome: mikrotikMap[venda.mikrotik_id]?.nome || 'MikroTik',
              vendas: 0,
              valor: 0
            }
          }
          mikrotikStats[venda.mikrotik_id].vendas += 1
          mikrotikStats[venda.mikrotik_id].valor += venda.valor || 0
        }
      })

      const topMikroTik = Object.values(mikrotikStats)
        .sort((a, b) => b.vendas - a.vendas)[0] || null

      // Processar vendas recentes (combinando PIX e físicas)
      const vendasPixRecentes = vendasPixData.slice(0, 5).map(v => ({
        id: v.id,
        valor_total: v.valor,
        plano_nome: v.plano_nome || 'Comissão PIX',
        plano_valor: v.valor,
        mac_address: v.mac_address || '',
        status: 'completed',
        created_at: v.created_at,
        tipo: 'pix',
        mikrotik: mikrotikMap[v.mikrotik_id] || { nome: 'MikroTik', id: v.mikrotik_id }
      }))
      
      const vendasFisicasRecentes = vendasFisicasData.slice(0, 5).map(v => ({
        id: v.id,
        valor_total: v.valor || v.plano_valor,
        plano_nome: v.plano_nome || 'Voucher Físico',
        plano_valor: v.valor || v.plano_valor,
        mac_address: v.mac_address || '',
        status: 'completed',
        created_at: v.created_at,
        tipo: v.tipo || 'fisica',
        senha: v.senha || '',
        mikrotik: mikrotikMap[v.mikrotik_id] || { nome: 'MikroTik', id: v.mikrotik_id }
      }))

      // Combinar e ordenar por data
      const vendasRecentes = [...vendasPixRecentes, ...vendasFisicasRecentes]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      // Buscar saldo atual do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('saldo')
        .eq('id', user.id)
        .single()

      setStats({
        totalVendas,
        vendasDia,
        vendasMes,
        rendaTotal,
        rendaDia,
        rendaMes,
        saldoAtual: userData?.saldo || 0,
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

  // Função para converter para horário de Manaus (UTC-4)
  const formatDateManaus = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Manaus'
    })
  }

  const formatDate = (dateString: string) => {
    return formatDateManaus(dateString)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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
      {/* Saldo e Plano Cards - Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Saldo Atual - Simplificado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-400/50 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-emerald-200/80 text-sm font-medium">Saldo Atual</p>
              <p className="text-3xl font-bold text-emerald-100">
                {formatCurrency(stats.saldoAtual)}
              </p>
              <p className="text-xs text-emerald-300/70 mt-1">Disponível para saque</p>
            </div>
          </div>
        </motion.div>

        {/* Plano Atual - Simplificado */}
        <UserSubscriptionCard />
      </div>

      {/* Stats Cards - Otimizados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Vendas no PIX */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-blue-200/80 text-sm font-medium">Vendas no PIX</p>
              <p className="text-2xl font-bold text-blue-100">{formatCurrency(stats.vendasPix.valorDia)}</p>
              <p className="text-xs text-blue-300/80">Hoje</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/30 border border-blue-400/30">
              <DollarSign className="h-6 w-6 text-blue-300" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-blue-400/80 font-medium">
              Mês: {formatCurrency(stats.vendasPix.valorMes)} ({stats.vendasPix.totalMes} vendas)
            </div>
            <div className="text-xs text-blue-300/70">
              Total: {formatCurrency(stats.vendasPix.valorTotal)} ({stats.vendasPix.total} vendas)
            </div>
          </div>
        </motion.div>

        {/* Vouchers Vendidos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-purple-200/80 text-sm font-medium">Vouchers Vendidos</p>
              <p className="text-2xl font-bold text-purple-100">{formatCurrency(stats.vendasFisicas.valorDia)}</p>
              <p className="text-xs text-purple-300/80">Hoje</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/30 border border-purple-400/30">
              <Activity className="h-6 w-6 text-purple-300" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-purple-400/80 font-medium">
              Mês: {formatCurrency(stats.vendasFisicas.valorMes)} ({stats.vendasFisicas.totalMes} vouchers)
            </div>
            <div className="text-xs text-purple-300/70">
              Total: {formatCurrency(stats.vendasFisicas.valorTotal)} ({stats.vendasFisicas.total} vouchers)
            </div>
          </div>
        </motion.div>

        {/* Vendas Totais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-green-200/80 text-sm font-medium">Vendas Totais</p>
              <p className="text-2xl font-bold text-green-100">
                {formatCurrency(stats.vendasPix.valorDia + stats.vendasFisicas.valorDia)}
              </p>
              <p className="text-xs text-green-300/80">Hoje</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/30 border border-green-400/30">
              <DollarSign className="h-6 w-6 text-green-300" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-green-400/80 font-medium">
              Mês: {formatCurrency(stats.vendasPix.valorMes + stats.vendasFisicas.valorMes)} ({stats.vendasPix.totalMes + stats.vendasFisicas.totalMes} vendas)
            </div>
            <div className="text-xs text-green-300/70">
              Total: {formatCurrency(stats.vendasPix.valorTotal + stats.vendasFisicas.valorTotal)} ({stats.vendasPix.total + stats.vendasFisicas.total} vendas)
            </div>
          </div>
        </motion.div>
      </div>

      {/* Vendas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas via PIX Recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Vendas via PIX Recentes</h3>
            <Eye className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats.vendasRecentes.filter(v => v.tipo === 'pix').length > 0 ? (
              stats.vendasRecentes.filter(v => v.tipo === 'pix').map((venda) => (
                <div
                  key={venda.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                      <DollarSign className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{venda.plano_nome}</p>
                      <p className="text-xs text-gray-400">{venda.mikrotik?.nome || 'MikroTik'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-400">{formatCurrency(venda.valor_total)}</p>
                    <p className="text-xs text-gray-500">{formatDate(venda.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">Nenhuma venda PIX recente</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Vouchers Vendidos Recentemente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Vouchers Vendidos Recentemente</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats.vendasRecentes.filter(v => v.tipo === 'fisica').length > 0 ? (
              stats.vendasRecentes.filter(v => v.tipo === 'fisica').map((voucher) => (
                <div
                  key={voucher.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                      <Activity className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{voucher.plano_nome}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-400">{voucher.mikrotik?.nome || 'MikroTik'}</p>
                        {voucher.senha && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {voucher.senha}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-purple-400">{formatCurrency(voucher.valor_total)}</p>
                    <p className="text-xs text-gray-500">{formatDate(voucher.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">Nenhum voucher vendido recentemente</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top MikroTik Stats */}
      {stats.topMikroTik && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">MikroTik com Mais Vendas</h3>
            <Router className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                <Router className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{stats.topMikroTik.nome}</p>
                <p className="text-sm text-gray-400">{stats.topMikroTik.vendas} vendas realizadas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-400">{formatCurrency(stats.topMikroTik.valor)}</p>
              <p className="text-xs text-gray-400">Total arrecadado</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function UserSubscriptionCard({ className }: PlanCardProps) {
  const { user } = useAuthContext()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserSubscription()
    }
  }, [user])

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans (*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching subscription:', error)
        setSubscription(null)
        setLoading(false)
        return
      }

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
    setShowUpgradeModal(true)
  }

  const handleCloseModal = () => {
    setShowUpgradeModal(false)
  }

  if (loading) {
    return (
      <div className={cn("bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 animate-pulse", className)}>
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 bg-blue-400/30 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-blue-400/30 rounded"></div>
            <div className="h-6 bg-blue-400/30 rounded"></div>
          </div>
          <div className="h-6 w-16 bg-blue-400/30 rounded"></div>
        </div>
        <div className="h-4 bg-blue-400/30 rounded mb-4"></div>
        <div className="h-8 bg-blue-400/30 rounded"></div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn("bg-gradient-to-br from-red-500/20 to-orange-600/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 hover:border-red-400/50 transition-all duration-300 hover:scale-[1.02]", className)}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30">
              <Crown className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-red-200/80 text-sm font-medium">Plano Atual</p>
              <p className="text-xl font-bold text-red-100">
                Nenhum Plano Ativo
              </p>
            </div>
          </div>

          <p className="text-red-200/70 text-sm mb-4">
            Ative um plano para acessar todos os recursos
          </p>

          <Button 
            onClick={handleOpenModal}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 py-2 rounded-xl font-medium"
          >
            <Crown className="w-4 h-4 mr-2" />
            Ativar Plano
          </Button>
        </motion.div>

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
  const progressPercent = Math.min(100, (daysRemaining / plan.duration_days) * 100) // Contagem regressiva

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02]",
          isNearExpiration() && "from-orange-500/20 to-red-600/20 border-orange-500/50",
          daysRemaining <= 0 && "from-red-500/20 to-red-600/20 border-red-500/50",
          className
        )}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            "p-3 rounded-xl border",
            isTrialPlan() 
              ? 'bg-yellow-500/20 border-yellow-400/30' 
              : 'bg-blue-500/20 border-blue-400/30'
          )}>
            {isTrialPlan() ? (
              <Sparkles className="h-6 w-6 text-yellow-400" />
            ) : (
              <Crown className="h-6 w-6 text-blue-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-blue-200/80 text-sm font-medium">Plano Atual</p>
            <p className="text-xl font-bold text-blue-100">
              {plan.name}
            </p>
          </div>

          {daysRemaining <= 0 ? (
            <Badge variant="destructive" className="border-red-500/20 bg-red-500/20 text-red-400">
              <XCircle className="w-3 h-3 mr-1" />
              Expirado
            </Badge>
          ) : daysRemaining <= 3 ? (
            <Badge variant="destructive" className="border-orange-500/20 bg-orange-500/20 text-orange-400">
              <Clock className="w-3 h-3 mr-1" />
              Expira em breve
            </Badge>
          ) : (
            <Badge variant="default" className="border-green-500/20 bg-green-500/20 text-green-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativo
            </Badge>
          )}
        </div>

        {/* Status e Tempo Restante */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-200 text-sm font-medium">
              {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Plano expirado'}
            </span>
            <span className="text-blue-400 text-xs">
              {Math.round(progressPercent)}%
            </span>
          </div>
          
          {/* Barra de Progresso - Contagem Regressiva */}
          <div className="w-full bg-black/30 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                daysRemaining <= 3 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 
                daysRemaining <= 7 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                'bg-gradient-to-r from-blue-500 to-purple-500'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Botão de Ação */}
        <Button 
          onClick={handleOpenModal}
          variant="outline"
          className={cn(
            "w-full py-2 rounded-xl font-medium",
            daysRemaining <= 3 
              ? "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-300 hover:text-orange-200"
              : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300 hover:text-blue-200"
          )}
        >
          <Crown className="w-4 h-4 mr-2" />
          {daysRemaining <= 0 ? 'Renovar Plano' : 
           daysRemaining <= 3 ? 'Renovar Plano' :
           isTrialPlan() ? 'Fazer Upgrade' : 'Gerenciar Plano'}
        </Button>
      </motion.div>

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