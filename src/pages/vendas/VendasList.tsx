import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  RefreshCw,
  ArrowUpDown,
  Eye,
  Router,
  CreditCard,
  Receipt,
  FileText,
  Users,
  Crown,
  Zap,
  PieChart,
  Target,
  Award,
  ChevronDown
} from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../lib/utils'

interface VendaDetalhada {
  id: string
  valor_total: number
  valor_admin?: number
  valor_usuario?: number
  plano_nome: string
  plano_valor: number
  mac_address: string
  status: string
  created_at: string
  tipo: 'pix' | 'fisica' | 'captive'
  senha?: string
  mikrotik: {
    nome: string
    id: string
  }
  usuario?: {
    nome: string
    email: string
    id: string
  }
  payment_id?: string
  ip_address?: string
}

interface ResumoVendas {
  totalGeral: {
    quantidade: number
    valor: number
  }
  vendasPix: {
    quantidade: number
    valor: number
  }
  vendasVoucher: {
    quantidade: number
    valor: number
  }
  periodoSelecionado: {
    quantidade: number
    valor: number
  }
  // Específico para admin
  comissaoAdmin?: {
    quantidade: number
    valor: number
  }
  comissaoUsuarios?: {
    quantidade: number
    valor: number
  }
  topUsuarios?: Array<{
    nome: string
    vendas: number
    valor: number
  }>
  topMikrotiks?: Array<{
    nome: string
    vendas: number
    valor: number
  }>
}

type TipoFiltro = 'todos' | 'pix' | 'voucher'
type OrdenacaoFiltro = 'data_desc' | 'data_asc' | 'valor_desc' | 'valor_asc'

export default function VendasList() {
  const { user } = useAuthContext()
  const [vendas, setVendas] = useState<VendaDetalhada[]>([])
  const [resumo, setResumo] = useState<ResumoVendas>({
    totalGeral: { quantidade: 0, valor: 0 },
    vendasPix: { quantidade: 0, valor: 0 },
    vendasVoucher: { quantidade: 0, valor: 0 },
    periodoSelecionado: { quantidade: 0, valor: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('todos')
  const [filtroMes, setFiltroMes] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [ordenacao, setOrdenacao] = useState<OrdenacaoFiltro>('data_desc')
  const [busca, setBusca] = useState('')
  
  // Filtros específicos para admin
  const [filtroUsuario, setFiltroUsuario] = useState<string>('todos')
  const [filtroMikrotik, setFiltroMikrotik] = useState<string>('todos')
  const [usuarios, setUsuarios] = useState<Array<{id: string, nome: string, email: string}>>([])
  const [mikrotiks, setMikrotiks] = useState<Array<{id: string, nome: string}>>([])
  
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        fetchAdminData()
      }
      fetchVendas()
    }
  }, [user, filtroTipo, filtroMes, ordenacao, filtroUsuario, filtroMikrotik])

  const fetchAdminData = async () => {
    if (!isAdmin) return

    try {
      // Buscar todos os usuários
      const { data: usuariosData } = await supabase
        .from('users')
        .select('id, nome, email')
        .eq('role', 'user')
        .order('nome')

      // Buscar todos os MikroTiks
      const { data: mikrotiksData } = await supabase
        .from('mikrotiks')
        .select('id, nome, user_id')
        .order('nome')

      setUsuarios(usuariosData || [])
      setMikrotiks(mikrotiksData || [])
    } catch (error) {
      console.error('Error fetching admin data:', error)
    }
  }

  const fetchVendas = async () => {
    if (!user) return

    console.log('🔍 [VENDAS] Iniciando busca de vendas:', {
      userId: user.id,
      userRole: user.role,
      isAdmin,
      filtroMes,
      filtroTipo,
      filtroUsuario,
      filtroMikrotik
    })

    try {
      setLoading(true)

      // Determinar período baseado no filtro de mês
      const [ano, mes] = filtroMes.split('-')
      const inicioMes = new Date(parseInt(ano), parseInt(mes) - 1, 1)
      const fimMes = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59)

      let userMikrotikIds: string[] = []
      let mikrotiksMap: Record<string, { id: string; nome: string; usuario?: any }> = {}

      if (isAdmin) {
        // Admin: buscar dados baseado nos filtros
        let mikrotiksQuery = supabase
          .from('mikrotiks')
          .select(`
            id, nome, user_id,
            users!inner(id, nome, email)
          `)

        // Aplicar filtro de usuário se selecionado
        if (filtroUsuario !== 'todos') {
          mikrotiksQuery = mikrotiksQuery.eq('user_id', filtroUsuario)
        }

        // Aplicar filtro de MikroTik se selecionado
        if (filtroMikrotik !== 'todos') {
          mikrotiksQuery = mikrotiksQuery.eq('id', filtroMikrotik)
        }

        const { data: adminMikrotiks, error: mikrotiksError } = await mikrotiksQuery

        if (mikrotiksError) {
          console.error('Error fetching admin mikrotiks:', mikrotiksError)
          return
        }

        userMikrotikIds = adminMikrotiks?.map(m => m.id) || []
        mikrotiksMap = adminMikrotiks?.reduce((acc, m) => {
          acc[m.id] = {
            id: m.id,
            nome: m.nome,
            usuario: (m as any).users
          }
          return acc
        }, {} as typeof mikrotiksMap) || {}

        console.log('🔍 [VENDAS] Admin MikroTiks encontrados:', {
          count: userMikrotikIds.length,
          filtroUsuario,
          filtroMikrotik,
          sampleMikrotik: adminMikrotiks?.[0]
        })

      } else {
        // Usuário regular: buscar apenas seus MikroTiks
        const { data: userMikrotiks, error: mikrotiksError } = await supabase
          .from('mikrotiks')
          .select('id, nome')
          .eq('user_id', user.id)

        if (mikrotiksError) {
          console.error('Error fetching mikrotiks:', mikrotiksError)
          return
        }

        userMikrotikIds = userMikrotiks?.map(m => m.id) || []
        mikrotiksMap = userMikrotiks?.reduce((acc: Record<string, { id: string; nome: string; usuario?: any }>, m: any) => {
          acc[m.id] = { id: m.id, nome: m.nome }
          return acc
        }, {}) || {}

        if (userMikrotikIds.length === 0) {
          setVendas([])
          if (!isAdmin) return // Só retorna early para usuários regulares
        }
      }

      // Buscar vendas PIX (apenas se houver MikroTiks)
      let vendasPixData: any[] = []
      let pixError = null
      
      if (userMikrotikIds.length > 0) {
        const result = await supabase
          .from('vendas_pix')
          .select(`
            id, payment_id, valor_total, valor_usuario, valor_admin,
            mac_address, created_at, status, mikrotik_id,
            plano_nome, plano_valor, porcentagem_admin, porcentagem_usuario
          `)
          .in('mikrotik_id', userMikrotikIds)
          .in('status', ['completed', 'approved'])
          .order('created_at', { ascending: false })
        
        vendasPixData = result.data || []
        pixError = result.error
      }

      console.log('🔍 [VENDAS] PIX Data Query:', { 
        vendasPixCount: vendasPixData?.length,
        pixError, 
        userMikrotikIds: userMikrotikIds.length, 
        inicioMes, 
        fimMes,
        isAdmin,
        sampleVenda: vendasPixData?.[0]
      })

      // Buscar vouchers físicos (apenas se houver MikroTiks)
      let vouchersData: any[] = []
      let vouchersError = null
      
      if (userMikrotikIds.length > 0) {
        const result = await supabase
          .from('voucher')
          .select('id, valor_venda, nome_plano, created_at, mac_address, mikrotik_id, tipo_voucher, senha')
          .in('mikrotik_id', userMikrotikIds)
          .eq('tipo_voucher', 'fisico')
          .order('created_at', { ascending: false })
        
        vouchersData = result.data || []
        vouchersError = result.error
      }

      console.log('Vouchers Data Query:', { 
        vouchersCount: vouchersData?.length,
        vouchersError, 
        userMikrotikIds: userMikrotikIds.length 
      })

      if (pixError && vouchersError) {
        console.error('Error fetching sales data:', { pixError, vouchersError })
        return
      }

      // Processar vendas PIX
      const vendasPixProcessadas: VendaDetalhada[] = (vendasPixData || [])
        .filter(v => {
          const dataVenda = new Date(v.created_at)
          return dataVenda >= inicioMes && dataVenda <= fimMes
        })
        .map(v => {
          const mikrotikInfo = mikrotiksMap[v.mikrotik_id] || { id: v.mikrotik_id, nome: 'MikroTik' }
          return {
            id: v.id,
            valor_total: isAdmin ? (v.valor_total || 0) : (v.valor_usuario || 0), // Admin vê valor total, usuário vê sua comissão
            valor_admin: v.valor_admin || 0,
            valor_usuario: v.valor_usuario || 0,
            plano_nome: v.plano_nome || 'Venda PIX',
            plano_valor: v.plano_valor || 0,
            mac_address: v.mac_address || '',
            status: v.status,
            created_at: v.created_at,
            tipo: 'pix' as const,
            mikrotik: {
              nome: mikrotikInfo.nome,
              id: mikrotikInfo.id
            },
            usuario: mikrotikInfo.usuario ? {
              nome: mikrotikInfo.usuario.nome,
              email: mikrotikInfo.usuario.email,
              id: mikrotikInfo.usuario.id
            } : undefined,
            payment_id: v.payment_id
          }
        })

      // Processar vouchers físicos
      const vouchersProcessados: VendaDetalhada[] = (vouchersData || [])
        .filter(v => {
          const dataVenda = new Date(v.created_at)
          return dataVenda >= inicioMes && dataVenda <= fimMes
        })
        .map(v => {
          const mikrotikInfo = mikrotiksMap[v.mikrotik_id] || { id: v.mikrotik_id, nome: 'MikroTik' }
          return {
            id: v.id,
            valor_total: v.valor_venda || 0,
            plano_nome: v.nome_plano || 'Voucher Físico',
            plano_valor: v.valor_venda || 0,
            mac_address: v.mac_address || '',
            status: 'completed',
            created_at: v.created_at,
            tipo: 'fisica' as const,
            senha: v.senha,
            mikrotik: {
              nome: mikrotikInfo.nome,
              id: mikrotikInfo.id
            },
            usuario: mikrotikInfo.usuario ? {
              nome: mikrotikInfo.usuario.nome,
              email: mikrotikInfo.usuario.email,
              id: mikrotikInfo.usuario.id
            } : undefined
          }
        })

      console.log('Dados processados:', { 
        vendasPixProcessadas: vendasPixProcessadas.length, 
        vouchersProcessados: vouchersProcessados.length,
        filtroMes,
        inicioMes,
        fimMes
      })

      // Combinar todas as vendas
      let todasVendas = [...vendasPixProcessadas, ...vouchersProcessados]

      // Aplicar filtro de tipo
      if (filtroTipo === 'pix') {
        todasVendas = todasVendas.filter(v => v.tipo === 'pix')
      } else if (filtroTipo === 'voucher') {
        todasVendas = todasVendas.filter(v => v.tipo === 'fisica')
      }

      // Aplicar ordenação
      todasVendas.sort((a, b) => {
        switch (ordenacao) {
          case 'data_asc':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case 'data_desc':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case 'valor_asc':
            return a.valor_total - b.valor_total
          case 'valor_desc':
            return b.valor_total - a.valor_total
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
      })

      setVendas(todasVendas)

      // Calcular totais gerais - baseado no schema vendas_pix
      const totalGeralTodos = {
        quantidade: (vendasPixData || []).length + (vouchersData || []).length,
        valor: isAdmin 
          ? [
              // Admin vê valor total das vendas
              ...(vendasPixData || []).map(v => v.valor_total || 0),
              ...(vouchersData || []).map(v => v.valor_venda || 0)
            ].reduce((sum, v) => sum + v, 0)
          : [
              // Usuário vê apenas sua comissão
              ...(vendasPixData || []).map(v => v.valor_usuario || 0),
              ...(vouchersData || []).map(v => v.valor_venda || 0)
            ].reduce((sum, v) => sum + v, 0)
      }

      const vendasPixTodos = {
        quantidade: (vendasPixData || []).length,
        valor: isAdmin 
          ? (vendasPixData || []).reduce((sum, v) => sum + (v.valor_total || 0), 0) // Admin: valor total
          : (vendasPixData || []).reduce((sum, v) => sum + (v.valor_usuario || 0), 0) // Usuário: sua comissão
      }

      const vendasVoucherTodos = {
        quantidade: (vouchersData || []).length,
        valor: (vouchersData || []).reduce((sum, v) => sum + (v.valor_venda || 0), 0)
      }

      const periodoSelecionado = {
        quantidade: todasVendas.length,
        valor: todasVendas.reduce((sum, v) => sum + v.valor_total, 0)
      }

      // Métricas específicas para admin
      let adminMetrics = {}
      if (isAdmin) {
        const comissaoAdmin = {
          quantidade: (vendasPixData || []).length,
          valor: (vendasPixData || []).reduce((sum, v) => sum + (v.valor_admin || 0), 0)
        }

        const comissaoUsuarios = {
          quantidade: (vendasPixData || []).length,
          valor: (vendasPixData || []).reduce((sum, v) => sum + (v.valor_usuario || 0), 0)
        }

        // Top usuários por vendas
        const vendasPorUsuario = todasVendas.reduce((acc, venda) => {
          if (venda.usuario) {
            const userId = venda.usuario.id
            if (!acc[userId]) {
              acc[userId] = {
                nome: venda.usuario.nome,
                vendas: 0,
                valor: 0
              }
            }
            acc[userId].vendas += 1
            acc[userId].valor += venda.valor_total
          }
          return acc
        }, {} as Record<string, { nome: string; vendas: number; valor: number }>)

        const topUsuarios = Object.values(vendasPorUsuario)
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 5)

        // Top MikroTiks por vendas
        const vendasPorMikrotik = todasVendas.reduce((acc, venda) => {
          const mikrotikId = venda.mikrotik.id
          if (!acc[mikrotikId]) {
            acc[mikrotikId] = {
              nome: venda.mikrotik.nome,
              vendas: 0,
              valor: 0
            }
          }
          acc[mikrotikId].vendas += 1
          acc[mikrotikId].valor += venda.valor_total
          return acc
        }, {} as Record<string, { nome: string; vendas: number; valor: number }>)

        const topMikrotiks = Object.values(vendasPorMikrotik)
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 5)

        adminMetrics = {
          comissaoAdmin,
          comissaoUsuarios,
          topUsuarios,
          topMikrotiks
        }

        console.log('📊 [VENDAS] Admin metrics calculadas:', {
          comissaoAdmin,
          comissaoUsuarios,
          topUsuarios: topUsuarios.length,
          topMikrotiks: topMikrotiks.length,
          vendasPixCount: vendasPixData?.length,
          todasVendasCount: todasVendas.length
        })
      }

      const resumoFinal = {
        totalGeral: totalGeralTodos,
        vendasPix: vendasPixTodos,
        vendasVoucher: vendasVoucherTodos,
        periodoSelecionado,
        ...adminMetrics
      }

      console.log('✅ [VENDAS] Resumo final:', resumoFinal)
      setResumo(resumoFinal)

    } catch (error) {
      console.error('Error fetching sales:', error)
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Manaus'
    })
  }

  const exportarCSV = () => {
    const headers = isAdmin 
      ? ['Data', 'Tipo', 'MikroTik', 'Usuário', 'Plano', 'Valor Total', 'Comissão Admin', 'Comissão User', 'MAC', 'Senha', 'Status']
      : ['Data', 'Tipo', 'MikroTik', 'Plano', 'Valor', 'MAC', 'Senha', 'Status']

    const csvData = vendas.map(venda => {
      if (isAdmin) {
        return [
          formatDateManaus(venda.created_at),
          venda.tipo === 'pix' ? 'PIX' : 'Voucher',
          venda.mikrotik.nome,
          venda.usuario?.nome || 'N/A',
          venda.plano_nome,
          venda.valor_total.toFixed(2),
          (venda.valor_admin || 0).toFixed(2),
          (venda.valor_usuario || 0).toFixed(2),
          venda.mac_address,
          venda.senha || '',
          venda.status
        ]
      } else {
        return [
          formatDateManaus(venda.created_at),
          venda.tipo === 'pix' ? 'PIX' : 'Voucher',
          venda.mikrotik.nome,
          venda.plano_nome,
          venda.valor_total.toFixed(2),
          venda.mac_address,
          venda.senha || '',
          venda.status
        ]
      }
    })

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `vendas-${isAdmin ? 'admin-' : ''}${filtroMes}.csv`
    link.click()
  }

  const vendasFiltradas = vendas.filter(venda =>
    busca === '' ||
    venda.plano_nome.toLowerCase().includes(busca.toLowerCase()) ||
    venda.mikrotik.nome.toLowerCase().includes(busca.toLowerCase()) ||
    venda.mac_address.toLowerCase().includes(busca.toLowerCase()) ||
    (venda.senha && venda.senha.toLowerCase().includes(busca.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              {isAdmin ? (
                <>
                  <Crown className="h-8 w-8 text-yellow-400" />
                  Relatório Administrativo de Vendas
                </>
              ) : (
                <>
                  <BarChart3 className="h-8 w-8 text-blue-400" />
                  Relatório de Vendas
                </>
              )}
            </h1>
            <p className="text-gray-400 mt-1">
              {isAdmin 
                ? 'Visão completa de todas as vendas, comissões e métricas do sistema'
                : 'Acompanhe suas vendas PIX e vouchers detalhadamente'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchVendas}
              variant="outline"
              className="border-gray-700 hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={exportarCSV}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </motion.div>

        {/* Resumo Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "grid gap-4",
            isAdmin 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" 
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {/* Total Geral */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-blue-200/80 text-sm font-medium">
                  {isAdmin ? 'Total Faturamento' : 'Total Geral'}
                </p>
                <p className="text-2xl font-bold text-blue-100">{formatCurrency(resumo.totalGeral.valor)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-300" />
            </div>
            <p className="text-blue-300/70 text-sm">{resumo.totalGeral.quantidade} vendas</p>
          </div>

          {/* Vendas PIX */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-green-200/80 text-sm font-medium">
                  {isAdmin ? 'PIX (Total)' : 'Vendas PIX'}
                </p>
                <p className="text-2xl font-bold text-green-100">{formatCurrency(resumo.vendasPix.valor)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-300" />
            </div>
            <p className="text-green-300/70 text-sm">{resumo.vendasPix.quantidade} vendas PIX</p>
          </div>

          {/* Admin: Comissão Admin */}
          {isAdmin && resumo.comissaoAdmin && (
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-emerald-200/80 text-sm font-medium">Comissão Admin</p>
                  <p className="text-2xl font-bold text-emerald-100">{formatCurrency(resumo.comissaoAdmin.valor)}</p>
                </div>
                <Crown className="h-8 w-8 text-emerald-300" />
              </div>
              <p className="text-emerald-300/70 text-sm">{resumo.comissaoAdmin.quantidade} vendas PIX</p>
            </div>
          )}

          {/* Admin: Comissão Usuários */}
          {isAdmin && resumo.comissaoUsuarios && (
            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-cyan-200/80 text-sm font-medium">Comissão Usuários</p>
                  <p className="text-2xl font-bold text-cyan-100">{formatCurrency(resumo.comissaoUsuarios.valor)}</p>
                </div>
                <Users className="h-8 w-8 text-cyan-300" />
              </div>
              <p className="text-cyan-300/70 text-sm">{resumo.comissaoUsuarios.quantidade} vendas PIX</p>
            </div>
          )}

          {/* Vouchers */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-purple-200/80 text-sm font-medium">Vouchers</p>
                <p className="text-2xl font-bold text-purple-100">{formatCurrency(resumo.vendasVoucher.valor)}</p>
              </div>
              <Receipt className="h-8 w-8 text-purple-300" />
            </div>
            <p className="text-purple-300/70 text-sm">{resumo.vendasVoucher.quantidade} vouchers</p>
          </div>

          {/* Período Selecionado */}
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-orange-200/80 text-sm font-medium">Período Atual</p>
                <p className="text-2xl font-bold text-orange-100">{formatCurrency(resumo.periodoSelecionado.valor)}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-300" />
            </div>
            <p className="text-orange-300/70 text-sm">{resumo.periodoSelecionado.quantidade} vendas no período</p>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por plano, MikroTik, MAC ou senha..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro de Mês */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="month"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro de Tipo */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as TipoFiltro)}
                className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="pix">PIX</option>
                <option value="voucher">Vouchers</option>
              </select>
            </div>

            {/* Filtros específicos para Admin */}
            {isAdmin && (
              <>
                {/* Filtro de Usuário */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <select
                    value={filtroUsuario}
                    onChange={(e) => setFiltroUsuario(e.target.value)}
                    className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Todos os Usuários</option>
                    {usuarios.map(usuario => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro de MikroTik */}
                <div className="flex items-center gap-2">
                  <Router className="h-4 w-4 text-gray-400" />
                  <select
                    value={filtroMikrotik}
                    onChange={(e) => setFiltroMikrotik(e.target.value)}
                    className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Todos os MikroTiks</option>
                    {mikrotiks.map(mikrotik => (
                      <option key={mikrotik.id} value={mikrotik.id}>
                        {mikrotik.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as OrdenacaoFiltro)}
                className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="data_desc">Data ↓</option>
                <option value="data_asc">Data ↑</option>
                <option value="valor_desc">Valor ↓</option>
                <option value="valor_asc">Valor ↑</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Métricas específicas para Admin */}
        {isAdmin && resumo.comissaoAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Métricas de Comissão */}
            <div className="lg:col-span-1 space-y-4">
              {/* Comissão Admin */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-emerald-200/80 text-sm font-medium">Comissão Admin</p>
                    <p className="text-2xl font-bold text-emerald-100">{formatCurrency(resumo.comissaoAdmin.valor)}</p>
                  </div>
                  <Crown className="h-8 w-8 text-emerald-300" />
                </div>
                <p className="text-emerald-300/70 text-sm">{resumo.comissaoAdmin.quantidade} vendas PIX</p>
              </div>

              {/* Comissão Usuários */}
              <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-cyan-200/80 text-sm font-medium">Comissão Usuários</p>
                    <p className="text-2xl font-bold text-cyan-100">{formatCurrency(resumo.comissaoUsuarios?.valor || 0)}</p>
                  </div>
                  <Users className="h-8 w-8 text-cyan-300" />
                </div>
                <p className="text-cyan-300/70 text-sm">{resumo.comissaoUsuarios?.quantidade || 0} vendas PIX</p>
              </div>
            </div>

            {/* Top Usuários */}
            <div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Award className="h-5 w-5 text-yellow-400 mr-2" />
                  Top Usuários
                </h3>
                <Badge variant="outline" className="text-xs">
                  Por volume
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {resumo.topUsuarios && resumo.topUsuarios.length > 0 ? (
                  resumo.topUsuarios.map((usuario, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-white">{usuario.nome}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-400">{formatCurrency(usuario.valor)}</p>
                        <p className="text-xs text-gray-500">{usuario.vendas} vendas</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">Nenhum dado disponível</p>
                )}
              </div>
            </div>

            {/* Top MikroTiks */}
            <div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Target className="h-5 w-5 text-blue-400 mr-2" />
                  Top MikroTiks
                </h3>
                <Badge variant="outline" className="text-xs">
                  Por volume
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {resumo.topMikrotiks && resumo.topMikrotiks.length > 0 ? (
                  resumo.topMikrotiks.map((mikrotik, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-white">{mikrotik.nome}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-400">{formatCurrency(mikrotik.valor)}</p>
                        <p className="text-xs text-gray-500">{mikrotik.vendas} vendas</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">Nenhum dado disponível</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabela de Vendas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-800/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Detalhes das Vendas ({vendasFiltradas.length})
            </h3>
          </div>

          {vendasFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhuma venda encontrada</p>
              <p className="text-gray-500 text-sm mt-2">
                Ajuste os filtros ou tente outro período
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      MikroTik
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Usuário
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {vendasFiltradas.map((venda, index) => (
                    <motion.tr
                      key={venda.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index % 10) }}
                      className="hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDateManaus(venda.created_at)}
                        <div className="text-xs text-gray-500">Horário de Manaus</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={cn(
                            "text-xs font-medium",
                            venda.tipo === 'pix'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          )}
                        >
                          {venda.tipo === 'pix' ? '💳 PIX' : '🎫 Voucher'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Router className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-white font-medium">
                            {venda.mikrotik.nome}
                          </span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {venda.usuario ? (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm text-white font-medium">
                                  {venda.usuario.nome}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {venda.usuario.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">N/A</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-medium">
                          {venda.plano_nome}
                        </div>
                        {venda.senha && (
                          <div className="text-xs text-blue-400 font-mono">
                            Senha: {venda.senha}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-green-400">
                          {formatCurrency(venda.valor_total)}
                        </div>
                        {isAdmin && venda.tipo === 'pix' && (
                          <div className="space-y-1 mt-1">
                            <div className="text-xs">
                              <span className="text-emerald-400">Admin: {formatCurrency(venda.valor_admin || 0)}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-cyan-400">User: {formatCurrency(venda.valor_usuario || 0)}</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div className="space-y-1">
                          {venda.mac_address && (
                            <div className="font-mono text-xs">
                              MAC: {venda.mac_address}
                            </div>
                          )}
                          {venda.payment_id && (
                            <div className="font-mono text-xs">
                              ID: {venda.payment_id.substring(0, 8)}...
                            </div>
                          )}
                          {venda.ip_address && (
                            <div className="font-mono text-xs">
                              IP: {venda.ip_address}
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}