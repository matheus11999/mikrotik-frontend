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
  FileText
} from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../lib/utils'

interface VendaDetalhada {
  id: string
  valor_total: number
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

  useEffect(() => {
    if (user) {
      fetchVendas()
    }
  }, [user, filtroTipo, filtroMes, ordenacao])

  const fetchVendas = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Buscar MikroTiks do usuário
      const { data: userMikrotiks, error: mikrotiksError } = await supabase
        .from('mikrotiks')
        .select('id, nome')
        .eq('user_id', user.id)

      if (mikrotiksError) {
        console.error('Error fetching mikrotiks:', mikrotiksError)
        return
      }

      const userMikrotikIds = userMikrotiks?.map(m => m.id) || []
      if (userMikrotikIds.length === 0) {
        setVendas([])
        return
      }

      // Determinar período baseado no filtro de mês
      const [ano, mes] = filtroMes.split('-')
      const inicioMes = new Date(parseInt(ano), parseInt(mes) - 1, 1)
      const fimMes = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59)

      // Buscar vendas PIX
      const { data: vendasPixData, error: pixError } = await supabase
        .from('vendas_pix')
        .select(`
          id, payment_id, valor_total, valor_usuario, valor_admin,
          mac_address, created_at, status, mikrotik_id,
          plano_nome, plano_valor
        `)
        .in('mikrotik_id', userMikrotikIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      console.log('PIX Data Query:', { vendasPixData, pixError, userMikrotikIds, inicioMes, fimMes })

      // Buscar vouchers físicos
      const { data: vouchersData, error: vouchersError } = await supabase
        .from('voucher')
        .select('id, valor_venda, nome_plano, created_at, mac_address, mikrotik_id, tipo_voucher, senha')
        .in('mikrotik_id', userMikrotikIds)
        .eq('tipo_voucher', 'fisico')
        .order('created_at', { ascending: false })

      console.log('Vouchers Data Query:', { vouchersData, vouchersError, userMikrotikIds })

      if (pixError && vouchersError) {
        console.error('Error fetching sales data:', { pixError, vouchersError })
        return
      }

      // Criar mapa de MikroTiks
      const mikrotikMap = userMikrotiks?.reduce((acc, m) => {
        acc[m.id] = m
        return acc
      }, {} as Record<string, { id: string; nome: string }>) || {}

      // Processar vendas PIX - USAR valor_usuario para comissão do usuário
      const vendasPixProcessadas: VendaDetalhada[] = (vendasPixData || [])
        .filter(v => {
          const dataVenda = new Date(v.created_at)
          return dataVenda >= inicioMes && dataVenda <= fimMes
        })
        .map(v => ({
          id: v.id,
          valor_total: v.valor_usuario || 0, // USAR valor_usuario para vendas PIX
          plano_nome: v.plano_nome || 'Venda PIX',
          plano_valor: v.plano_valor || 0,
          mac_address: v.mac_address || '',
          status: v.status,
          created_at: v.created_at,
          tipo: 'pix' as const,
          mikrotik: mikrotikMap[v.mikrotik_id] || { nome: 'MikroTik', id: v.mikrotik_id },
          payment_id: v.payment_id
        }))

      // Processar vouchers físicos
      const vouchersProcessados: VendaDetalhada[] = (vouchersData || [])
        .filter(v => {
          const dataVenda = new Date(v.created_at)
          return dataVenda >= inicioMes && dataVenda <= fimMes
        })
        .map(v => ({
          id: v.id,
          valor_total: v.valor_venda || 0,
          plano_nome: v.nome_plano || 'Voucher Físico',
          plano_valor: v.valor_venda || 0,
          mac_address: v.mac_address || '',
          status: 'completed',
          created_at: v.created_at,
          tipo: 'fisica' as const,
          senha: v.senha,
          mikrotik: mikrotikMap[v.mikrotik_id] || { nome: 'MikroTik', id: v.mikrotik_id }
        }))

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

      // Calcular totais gerais (todos os dados, sem filtro de período) - USAR valor_usuario para PIX
      const totalGeralTodos = {
        quantidade: (vendasPixData || []).length + (vouchersData || []).length,
        valor: [
          ...(vendasPixData || []).map(v => v.valor_usuario || 0), // USAR valor_usuario para PIX
          ...(vouchersData || []).map(v => v.valor_venda || 0)
        ].reduce((sum, v) => sum + v, 0)
      }

      const vendasPixTodos = {
        quantidade: (vendasPixData || []).length,
        valor: (vendasPixData || []).reduce((sum, v) => sum + (v.valor_usuario || 0), 0) // USAR valor_usuario para PIX
      }

      const vendasVoucherTodos = {
        quantidade: (vouchersData || []).length,
        valor: (vouchersData || []).reduce((sum, v) => sum + (v.valor_venda || 0), 0)
      }

      // Calcular resumo do período filtrado
      const totalGeral = totalGeralTodos
      const vendasPix = vendasPixTodos
      const vendasVoucher = vendasVoucherTodos

      const periodoSelecionado = {
        quantidade: todasVendas.length,
        valor: todasVendas.reduce((sum, v) => sum + v.valor_total, 0)
      }

      setResumo({
        totalGeral,
        vendasPix,
        vendasVoucher,
        periodoSelecionado
      })

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
    const headers = ['Data', 'Tipo', 'MikroTik', 'Plano', 'Valor', 'MAC', 'Senha', 'Status']
    const csvData = vendas.map(venda => [
      formatDateManaus(venda.created_at),
      venda.tipo === 'pix' ? 'PIX' : 'Voucher',
      venda.mikrotik.nome,
      venda.plano_nome,
      venda.valor_total.toFixed(2), // Já está usando o valor correto (valor_usuario para PIX)
      venda.mac_address,
      venda.senha || '',
      venda.status
    ])

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `vendas-${filtroMes}.csv`
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
              <BarChart3 className="h-8 w-8 text-blue-400" />
              Relatório de Vendas
            </h1>
            <p className="text-gray-400 mt-1">Acompanhe suas vendas PIX e vouchers detalhadamente</p>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Total Geral */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-blue-200/80 text-sm font-medium">Total Geral</p>
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
                <p className="text-green-200/80 text-sm font-medium">Vendas PIX</p>
                <p className="text-2xl font-bold text-green-100">{formatCurrency(resumo.vendasPix.valor)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-300" />
            </div>
            <p className="text-green-300/70 text-sm">{resumo.vendasPix.quantidade} vendas PIX</p>
          </div>

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