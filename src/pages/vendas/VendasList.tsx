import { useEffect, useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { 
  ShoppingCart, Search, TrendingUp, DollarSign, Calendar, 
  User, Router, Eye, Clock, CheckCircle, XCircle, 
  Loader2, Filter, ArrowUpDown, BarChart3, Ticket, CreditCard,
  CalendarDays, TrendingDown
} from 'lucide-react'
import React from 'react'
import { ListLoading } from '../../components/ui/unified-loading'

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
  mercadopago_payment_id?: string
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

interface Voucher {
  id: number
  senha: string
  data_conexao: string
  valor_venda: number
  mikrotik_id: string
  nome_plano: string
  comentario_original: string
  username: string
  mac_address: string
  created_at: string
  mikrotiks?: {
    nome: string
    users?: {
      nome: string
      email: string
    }
  }
}

type TipoVenda = 'all' | 'pix' | 'voucher'
type PeriodoRelatorio = 'hoje' | 'semana' | 'mes' | 'custom'

const motion = {
  div: (props: any) => <div {...props} />,
  h1: (props: any) => <h1 {...props} />,
  h3: (props: any) => <h3 {...props} />,
  p: (props: any) => <p {...props} />,
  select: (props: any) => <select {...props} />,
  span: (props: any) => <span {...props} />,
  button: (props: any) => <button {...props} />,
  input: (props: any) => <input {...props} />,
}

export function VendasList() {
  const { user } = useAuthContext()
  const [vendas, setVendas] = useState<Venda[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tipoVenda, setTipoVenda] = useState<TipoVenda>('all')
  const [periodoRelatorio, setPeriodoRelatorio] = useState<PeriodoRelatorio>('mes')
  const [mesCustom, setMesCustom] = useState('')

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)
      await Promise.all([fetchVendas(), fetchVouchers()])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVendas = async () => {
    if (!user) return

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
    if (user?.role !== 'admin') {
      const { data: userMikrotiks } = await supabase
        .from('mikrotiks')
        .select('id')
        .eq('user_id', user.id)
      
      const mikrotikIds = userMikrotiks?.map(m => m.id) || []
      if (mikrotikIds.length > 0) {
        query = query.in('mikrotik_id', mikrotikIds)
      } else {
        setVendas([])
        return
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    setVendas(data || [])
  }

  const fetchVouchers = async () => {
    if (!user) return

    let query = supabase
      .from('voucher')
      .select(`
        *,
        mikrotiks (
          nome,
          users (
            nome,
            email
          )
        )
      `)

    // Se não é admin, mostrar apenas vouchers dos seus MikroTiks
    if (user?.role !== 'admin') {
      const { data: userMikrotiks } = await supabase
        .from('mikrotiks')
        .select('id')
        .eq('user_id', user.id)
      
      const mikrotikIds = userMikrotiks?.map(m => m.id) || []
      if (mikrotikIds.length > 0) {
        query = query.in('mikrotik_id', mikrotikIds)
      } else {
        setVouchers([])
        return
      }
    }

    const { data, error } = await query.order('data_conexao', { ascending: false })

    if (error) throw error
    setVouchers(data || [])
  }

  // Função para verificar se uma venda é via PIX ou voucher físico
  const isVendaPix = (venda: Venda): boolean => {
    return !!(venda.mercadopago_payment_id && !venda.mercadopago_payment_id.startsWith('captive_'))
  }

  const isVendaVoucher = (venda: Venda): boolean => {
    return !venda.mercadopago_payment_id || venda.mercadopago_payment_id.startsWith('captive_')
  }

  // Filtrar dados por período
  const getDateRange = () => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    switch (periodoRelatorio) {
      case 'hoje':
        return { start: startOfToday, end: new Date() }
      case 'semana':
        return { start: startOfWeek, end: new Date() }
      case 'mes':
        return { start: startOfMonth, end: new Date() }
      case 'custom':
        if (mesCustom) {
          const [year, month] = mesCustom.split('-')
          const start = new Date(parseInt(year), parseInt(month) - 1, 1)
          const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
          return { start, end }
        }
        return { start: startOfMonth, end: new Date() }
      default:
        return { start: startOfMonth, end: new Date() }
    }
  }

  const isInDateRange = (date: string) => {
    const itemDate = new Date(date)
    const { start, end } = getDateRange()
    return itemDate >= start && itemDate <= end
  }

  // Filtrar vendas
  const filteredVendas = vendas.filter(venda => {
    const matchesSearch = 
      (venda.mac_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (venda.payment_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (venda.mikrotiks?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (venda.mikrotiks?.users?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (venda.planos?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || venda.status === statusFilter
    const matchesDateRange = isInDateRange(venda.created_at)

    let matchesTipo = true
    if (tipoVenda === 'pix') {
      matchesTipo = isVendaPix(venda)
    } else if (tipoVenda === 'voucher') {
      matchesTipo = isVendaVoucher(venda)
    }

    return matchesSearch && matchesStatus && matchesDateRange && matchesTipo
  })

  // Filtrar vouchers
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = 
      (voucher.mac_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.senha || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.mikrotiks?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.nome_plano || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDateRange = isInDateRange(voucher.data_conexao)

    return matchesSearch && matchesDateRange && (tipoVenda === 'all' || tipoVenda === 'voucher')
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

  // Calcular estatísticas
  const vendasPix = filteredVendas.filter(isVendaPix)
  const vendasVoucherTabela = filteredVendas.filter(isVendaVoucher)
  
  // Estatísticas PIX (usar valor_usuario para comissão)
  const totalVendasPix = vendasPix.reduce((sum, venda) => sum + Number(venda.valor_total), 0)
  const totalComissaoPix = vendasPix.reduce((sum, venda) => sum + Number(venda.valor_usuario), 0)
  const quantidadeVendasPix = vendasPix.length

  // Estatísticas Vouchers físicos (valor total sem comissão)
  const totalVouchersTabela = vendasVoucherTabela.reduce((sum, venda) => sum + Number(venda.valor_total), 0)
  const totalVouchersUsados = filteredVouchers.reduce((sum, voucher) => sum + Number(voucher.valor_venda), 0)
  const quantidadeVouchersTabela = vendasVoucherTabela.length
  const quantidadeVouchersUsados = filteredVouchers.length

  // Totais combinados de vouchers
  const totalVouchers = totalVouchersTabela + totalVouchersUsados
  const quantidadeVouchers = quantidadeVouchersTabela + quantidadeVouchersUsados

  const getPeriodoTexto = () => {
    switch (periodoRelatorio) {
      case 'hoje': return 'Hoje'
      case 'semana': return 'Esta Semana'
      case 'mes': return 'Este Mês'
      case 'custom': return mesCustom ? `${mesCustom}` : 'Período Personalizado'
      default: return 'Este Mês'
    }
  }

  if (loading) {
    return <ListLoading isLoading={loading} message="Carregando relatório de vendas..." />
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
              className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20"
            >
              <BarChart3 className="h-6 w-6 text-green-400" />
            </motion.div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              >
                Relatório de Vendas
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-400"
              >
                {user?.role === 'admin' ? 'Todas as vendas do sistema' : 'Vendas dos seus MikroTiks'} - {getPeriodoTexto()}
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
            className="space-y-4"
          >
            {/* Linha 1: Busca e Status */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por MAC, ID, MikroTik, plano..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-black/40 backdrop-blur-sm border-gray-800/50 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl transition-all duration-200"
                />
              </div>
              <motion.select
                whileHover={{ scale: 1.02 }}
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-black/40 backdrop-blur-sm border border-gray-800/50 text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 min-w-[180px]"
              >
                <option value="all">Todos os Status</option>
                <option value="completed">✅ Completas</option>
                <option value="pending">⏳ Pendentes</option>
                <option value="failed">❌ Falharam</option>
                <option value="cancelled">⏹️ Canceladas</option>
              </motion.select>
            </div>

            {/* Linha 2: Filtros de Tipo e Período */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.select
                whileHover={{ scale: 1.02 }}
                value={tipoVenda}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTipoVenda(e.target.value as TipoVenda)}
                className="px-4 py-3 bg-black/40 backdrop-blur-sm border border-gray-800/50 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              >
                <option value="all">📊 Todos os Tipos</option>
                <option value="pix">💳 Vendas PIX</option>
                <option value="voucher">🎫 Vouchers Físicos</option>
              </motion.select>

              <motion.select
                whileHover={{ scale: 1.02 }}
                value={periodoRelatorio}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPeriodoRelatorio(e.target.value as PeriodoRelatorio)}
                className="px-4 py-3 bg-black/40 backdrop-blur-sm border border-gray-800/50 text-white rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              >
                <option value="hoje">📅 Hoje</option>
                <option value="semana">📅 Esta Semana</option>
                <option value="mes">📅 Este Mês</option>
                <option value="custom">📅 Mês Específico</option>
              </motion.select>

              {periodoRelatorio === 'custom' && (
                <motion.input
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  type="month"
                  value={mesCustom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMesCustom(e.target.value)}
                  className="px-4 py-3 bg-black/40 backdrop-blur-sm border border-gray-800/50 text-white rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                />
              )}
            </div>
          </motion.div>

          {/* Cards de Estatísticas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {/* PIX - Vendas */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:border-blue-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <CreditCard className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                  {quantidadeVendasPix}
                </span>
              </div>
              <div>
                <p className="text-blue-400 text-sm font-medium mb-2">Vendas PIX</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalVendasPix)}</p>
                <p className="text-xs text-blue-300 mt-1">
                  Sua comissão: {formatCurrency(totalComissaoPix)}
                </p>
              </div>
            </motion.div>

            {/* Vouchers Físicos */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:border-orange-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                  <Ticket className="h-6 w-6 text-orange-400" />
                </div>
                <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">
                  {quantidadeVouchers}
                </span>
              </div>
              <div>
                <p className="text-orange-400 text-sm font-medium mb-2">Vouchers Físicos</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalVouchers)}</p>
                <p className="text-xs text-orange-300 mt-1">
                  Apenas relatório (sem comissão)
                </p>
              </div>
            </motion.div>

            {/* Total Geral */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-green-500/10 to-green-600/5 hover:border-green-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                  Total
                </span>
              </div>
              <div>
                <p className="text-green-400 text-sm font-medium mb-2">Faturamento Total</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalVendasPix + totalVouchers)}</p>
                <p className="text-xs text-green-300 mt-1">
                  PIX + Vouchers
                </p>
              </div>
            </motion.div>

            {/* Sua Receita */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                  Sua parte
                </span>
              </div>
              <div>
                <p className="text-purple-400 text-sm font-medium mb-2">
                  {user?.role === 'admin' ? 'Comissão Admin' : 'Sua Receita'}
                </p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalComissaoPix)}</p>
                <p className="text-xs text-purple-300 mt-1">
                  Apenas PIX (vouchers sem comissão)
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Lista de Vendas e Vouchers */}
          {filteredVendas.length === 0 && filteredVouchers.length === 0 ? (
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
                  <BarChart3 className="h-12 w-12 text-green-400" />
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4"
                >
                  Nenhuma venda encontrada
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-gray-400 text-lg"
                >
                  Tente ajustar os filtros de período ou tipo de venda
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
              {/* Vouchers Usados */}
              {(tipoVenda === 'all' || tipoVenda === 'voucher') && filteredVouchers.map((voucher, index) => (
                <motion.div
                  key={`voucher-${voucher.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-black/40 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Informações Principais */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          🎫 Voucher Físico
                        </Badge>
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                          #{voucher.id}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Router className="h-4 w-4 text-blue-400" />
                          <span className="text-gray-400">MikroTik:</span>
                          <span className="text-white font-medium">{voucher.mikrotiks?.nome || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-400" />
                          <span className="text-gray-400">Dono:</span>
                          <span className="text-white font-medium">{voucher.mikrotiks?.users?.nome || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-purple-400" />
                          <span className="text-gray-400">Plano:</span>
                          <span className="text-white font-medium">{voucher.nome_plano || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Senha:</span>
                          <span className="text-white font-mono text-xs">{voucher.senha}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">MAC:</span>
                          <span className="text-white font-mono text-xs">{voucher.mac_address}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Usado em:</span>
                          <span className="text-white text-xs">{formatDate(voucher.data_conexao)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="flex flex-col gap-3 lg:min-w-[200px]">
                      <div className="text-center lg:text-right">
                        <p className="text-xs text-gray-400 mb-1">Valor do Voucher</p>
                        <p className="text-xl font-bold text-orange-400">{formatCurrency(Number(voucher.valor_venda))}</p>
                      </div>
                      
                      <div className="text-center lg:text-right">
                        <p className="text-xs text-orange-300">Sem comissão (relatório)</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Vendas PIX e Vouchers da tabela vendas */}
              {filteredVendas.map((venda, index) => {
                const isPix = isVendaPix(venda)
                const borderColor = isPix ? 'border-blue-500/30' : 'border-orange-500/30'
                const hoverBorderColor = isPix ? 'hover:border-blue-500/50' : 'hover:border-orange-500/50'
                
                return (
                  <motion.div
                    key={venda.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index + filteredVouchers.length) * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className={`bg-black/40 backdrop-blur-sm border ${borderColor} rounded-2xl p-6 ${hoverBorderColor} transition-all duration-300 hover:shadow-2xl`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Informações Principais */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          {isPix ? (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              💳 Venda PIX
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              🎫 Voucher (Captive)
                            </Badge>
                          )}
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
                          <p className={`text-xl font-bold ${isPix ? 'text-blue-400' : 'text-orange-400'}`}>
                            {formatCurrency(Number(venda.valor_total))}
                          </p>
                        </div>
                        
                        {isPix ? (
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
                        ) : (
                          <div className="text-center lg:text-right">
                            <p className="text-xs text-orange-300">Sem comissão (relatório)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}