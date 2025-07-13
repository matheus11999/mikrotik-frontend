import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Button, 
  Input, 
  Switch, 
  useToast, 
  useModal, 
  useConfirm,
  InlineLoader,
  ListLoading
} from '../../components/ui'
import { SaqueModal } from '../../components/saques/SaqueModal'
import { TrendingUp, Search, Clock, CheckCircle, XCircle, Calendar, User, DollarSign, Plus, AlertCircle, RefreshCw, Zap, Shield } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Saque {
  id: string
  valor: number
  status: 'pendente' | 'aprovado' | 'rejeitado'
  metodo_pagamento: 'pix' | 'ted' | 'doc'
  chave_pix?: string
  dados_bancarios?: any
  observacoes?: string
  observacoes_admin?: string
  automatico?: boolean
  created_at: string
  processed_at?: string
  processed_by?: string
  user_id: string
  user?: {
    id: string
    nome: string
    email: string
    saque_automatico?: boolean
  }
  admin_user?: {
    id: string
    nome: string
    email: string
  }
}

export function SaquesList() {
  const { user } = useAuthContext()
  const { addToast } = useToast()
  const saqueModal = useModal()
  const { confirm, ConfirmComponent } = useConfirm()
  
  const [saques, setSaques] = useState<Saque[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [saqueAutomatico, setSaqueAutomatico] = useState(false)
  const [updatingSaqueAutomatico, setUpdatingSaqueAutomatico] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'aprovado' | 'rejeitado'>('all')

  useEffect(() => {
    fetchSaques()
    fetchUserSaqueAutomatico()
  }, [user])

  const fetchUserSaqueAutomatico = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('saque_automatico')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setSaqueAutomatico(data?.saque_automatico || false)
    } catch (error) {
      console.error('Error fetching saque automatico status:', error)
    }
  }

  const updateSaqueAutomatico = async (enabled: boolean) => {
    if (!user) return
    
    try {
      setUpdatingSaqueAutomatico(true)
      
      const { error } = await supabase
        .from('users')
        .update({ saque_automatico: enabled })
        .eq('id', user.id)

      if (error) throw error
      
      setSaqueAutomatico(enabled)
      
      addToast({
        type: 'success',
        title: enabled ? 'Saque automático ativado!' : 'Saque automático desativado',
        description: enabled 
          ? 'Quando seu saldo atingir R$ 50,00, um saque será solicitado automaticamente.'
          : 'Você precisará solicitar saques manualmente.'
      })
    } catch (error) {
      console.error('Error updating saque automatico:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Não foi possível atualizar a configuração de saque automático'
      })
    } finally {
      setUpdatingSaqueAutomatico(false)
    }
  }

  const fetchSaques = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      console.log('Fetching saques directly from Supabase for user:', user?.id, user?.role)
      
      // Buscar saques diretamente do Supabase (RLS desabilitado)
      let query = supabase
        .from('saques')
        .select('*')

      // Se não for admin, mostrar apenas próprios saques
      if (user?.role !== 'admin') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      console.log('Saques query result:', { data, error })

      if (error) throw error

      // Buscar dados dos usuários para cada saque
      const saquesWithUsers = await Promise.all(
        (data || []).map(async (saque) => {
          // Buscar dados do usuário
          const { data: userData } = await supabase
            .from('users')
            .select('id, nome, email')
            .eq('id', saque.user_id)
            .single()

          // Buscar dados do admin que processou (se houver)
          let adminData = null
          if (saque.processed_by) {
            const { data: admin } = await supabase
              .from('users')
              .select('id, nome, email')
              .eq('id', saque.processed_by)
              .single()
            adminData = admin
          }

          return {
            ...saque,
            user: userData,
            admin_user: adminData
          }
        })
      )

      setSaques(saquesWithUsers)
    } catch (error) {
      console.error('Error fetching saques:', error)
      setSaques([])
      alert('Erro ao carregar saques: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }


  const handleApproveSaque = async (saqueId: string) => {
    if (!user || user.role !== 'admin') return
    
    const confirmed = await confirm({
      title: 'Aprovar Saque',
      description: 'Tem certeza que deseja aprovar esta solicitação de saque?',
      confirmText: 'Aprovar',
      variant: 'default'
    })

    if (!confirmed) return
    
    try {
      setProcessingAction(saqueId)
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/saques/${saqueId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ observacoes_admin: 'Aprovado pelo admin' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao aprovar saque')
      }

      addToast({
        type: 'success',
        title: 'Saque aprovado!',
        description: 'A solicitação foi aprovada com sucesso.'
      })
      
      fetchSaques()
    } catch (error: any) {
      console.error('Error approving saque:', error)
      addToast({
        type: 'error',
        title: 'Erro ao aprovar saque',
        description: error?.message || 'Tente novamente em alguns instantes.'
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleRejectSaque = async (saqueId: string) => {
    if (!user || user.role !== 'admin') return
    
    const confirmed = await confirm({
      title: 'Rejeitar Saque',
      description: 'Esta ação não pode ser desfeita. O saldo será devolvido ao usuário.',
      confirmText: 'Rejeitar',
      variant: 'destructive'
    })

    if (!confirmed) return
    
    try {
      setProcessingAction(saqueId)
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/saques/${saqueId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ observacoes_admin: 'Rejeitado pelo admin' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao rejeitar saque')
      }

      addToast({
        type: 'success',
        title: 'Saque rejeitado',
        description: 'A solicitação foi rejeitada e o saldo foi devolvido.'
      })
      
      fetchSaques()
    } catch (error: any) {
      console.error('Error rejecting saque:', error)
      addToast({
        type: 'error',
        title: 'Erro ao rejeitar saque',
        description: error?.message || 'Tente novamente em alguns instantes.'
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const filteredSaques = saques
    .filter(saque => {
      // Filtro por status
      if (statusFilter !== 'all' && saque.status !== statusFilter) return false;
      
      // Filtro por busca
      return (
        (saque.dados_bancarios || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (saque.metodo_pagamento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (saque.user?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (saque.chave_pix || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Priorizar pendentes primeiro, depois por data
      if (a.status === 'pendente' && b.status !== 'pendente') return -1;
      if (b.status === 'pendente' && a.status !== 'pendente') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })

  const totalSaques = saques.reduce((sum, saque) => sum + saque.valor, 0)
  const saquesPendentes = saques.filter(s => s.status === 'pendente').length
  const saquesAprovados = saques.filter(s => s.status === 'aprovado').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'rejeitado': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado': return <CheckCircle className="h-4 w-4" />
      case 'rejeitado': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return <ListLoading isLoading={loading} message="Carregando dados dos saques..." />
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-800 bg-black"
      >
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 rounded-xl bg-gray-900 border border-gray-700"
                >
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-white">
                    Saques
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">Solicitações de saque e histórico</p>
                </div>
              </div>

              {user?.role !== 'admin' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={saqueModal.open}
                    className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 w-full sm:w-auto hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Solicitar Saque
                  </Button>
                </motion.div>
              )}
              
              {user?.role === 'admin' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center space-x-3"
                >
                  <Button
                    onClick={fetchSaques}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 transition-all duration-300"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Painel de Aprovação</p>
                    <p className="text-sm font-medium text-orange-400">Admin</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

          {/* Saque Automático Switch - Apenas para usuários não-admin */}
          {user?.role !== 'admin' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-black border border-gray-700">
                    <Zap className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Saque Automático</h3>
                    <p className="text-gray-400 text-sm">
                      Solicitar saque de R$ 50,00 automaticamente
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {updatingSaqueAutomatico && (
                    <InlineLoader size="sm" />
                  )}
                  <Switch
                    checked={saqueAutomatico}
                    onCheckedChange={updateSaqueAutomatico}
                    disabled={updatingSaqueAutomatico}
                    className="data-[state=checked]:bg-orange-600"
                  />
                  <span className="text-sm text-gray-400">
                    {saqueAutomatico ? 'Ativado' : 'Desativado'}
                  </span>
                </div>
              </div>
              {saqueAutomatico && !user?.chave_pix && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">
                      Configure sua chave PIX padrão no perfil para ativar o saque automático
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Admin Info Panel */}
          {user?.role === 'admin' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-black border border-gray-700">
                    <Shield className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Painel Administrativo</h3>
                    <p className="text-gray-400 text-sm">
                      Gerencie solicitações de saque dos usuários
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-400 text-sm font-medium">Aprovação/Rejeição</p>
                  <p className="text-xs text-gray-400">Somente visualização e ações admin</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Search */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por dados bancários, método ou usuário..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 sm:py-4 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-base sm:text-lg"
            />
          </motion.div>

          {/* Stats - Layout Horizontal Compacto */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-orange-600">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    {user?.role === 'admin' ? 'Total' : 'Sacado'}
                  </p>
                  <p className="text-lg font-bold text-white">R$ {totalSaques.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-yellow-600">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Pendentes</p>
                  <p className="text-lg font-bold text-white">{saquesPendentes}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-600">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Aprovados</p>
                  <p className="text-lg font-bold text-white">{saquesAprovados}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-red-600">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Rejeitados</p>
                  <p className="text-lg font-bold text-white">{saques.filter(s => s.status === 'rejeitado').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Saques List */}
          {filteredSaques.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center py-16"
            >
              <div className="text-center max-w-md">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  className="w-24 h-24 mx-auto mb-8 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center"
                >
                  <TrendingUp className="h-12 w-12 text-gray-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {saques.length === 0 ? 'Nenhum saque encontrado' : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-gray-400 text-lg">
                  {user?.role === 'admin' 
                    ? saques.length === 0 
                      ? 'Não há solicitações de saque para aprovar'
                      : 'Tente ajustar os termos de busca'
                    : saques.length === 0 
                      ? 'Faça sua primeira solicitação de saque'
                      : 'Tente ajustar os termos de busca'
                  }
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {/* Cabeçalho da Tabela */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-4">
                <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-300">
                  <div className="col-span-3">Solicitação</div>
                  <div className="col-span-2">Valor</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Método</div>
                  {user?.role === 'admin' && <div className="col-span-2">Usuário</div>}
                  <div className={user?.role === 'admin' ? "col-span-1" : "col-span-3"}>Ações</div>
                </div>
              </div>

              {/* Lista de Saques */}
              {filteredSaques.map((saque, index) => (
                <motion.div
                  key={saque.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`${
                    saque.status === 'pendente' 
                      ? 'bg-black/40 backdrop-blur-sm border border-yellow-500/50 hover:border-yellow-400/70 shadow-lg shadow-yellow-500/10' 
                      : 'bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/70'
                  } rounded-2xl px-6 py-4 transition-all duration-300 hover:scale-[1.01]`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Solicitação */}
                    <div className="col-span-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20">
                          <TrendingUp className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">#{saque.id.slice(0, 8)}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(saque.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          {saque.automatico && (
                            <div className="inline-flex items-center space-x-1 mt-1">
                              <Zap className="h-3 w-3 text-orange-400" />
                              <span className="text-xs text-orange-400">Auto</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="col-span-2">
                      <p className="text-lg font-bold text-white">R$ {saque.valor.toFixed(2)}</p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(saque.status)}`}>
                        {getStatusIcon(saque.status)}
                        <span className="capitalize">{saque.status}</span>
                      </div>
                      {saque.processed_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(saque.processed_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    {/* Método */}
                    <div className="col-span-2">
                      <p className="text-white font-medium uppercase">{saque.metodo_pagamento}</p>
                      {saque.metodo_pagamento === 'pix' ? (
                        <p className="text-xs text-gray-400 truncate">{saque.chave_pix}</p>
                      ) : (
                        <p className="text-xs text-gray-400">{saque.dados_bancarios?.banco}</p>
                      )}
                    </div>

                    {/* Usuário (apenas admin) */}
                    {user?.role === 'admin' && (
                      <div className="col-span-2">
                        <p className="text-white font-medium">{saque.user?.nome}</p>
                        <p className="text-xs text-gray-400">{saque.user?.email}</p>
                      </div>
                    )}

                    {/* Ações */}
                    <div className={user?.role === 'admin' ? "col-span-1" : "col-span-3"}>
                      {user?.role === 'admin' && saque.status === 'pendente' ? (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleApproveSaque(saque.id)}
                            disabled={processingAction === saque.id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1"
                          >
                            {processingAction === saque.id ? (
                              <InlineLoader size="sm" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleRejectSaque(saque.id)}
                            disabled={processingAction === saque.id}
                            variant="destructive"
                            size="sm"
                            className="px-3 py-1"
                          >
                            {processingAction === saque.id ? (
                              <InlineLoader size="sm" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          {saque.status === 'pendente' && (
                            <span className="text-xs text-yellow-400">Aguardando</span>
                          )}
                          {saque.status === 'aprovado' && (
                            <span className="text-xs text-green-400">Processado</span>
                          )}
                          {saque.status === 'rejeitado' && (
                            <span className="text-xs text-red-400">Rejeitado</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observações (expandido) */}
                  {(saque.observacoes || saque.observacoes_admin) && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      {saque.observacoes && (
                        <div className="mb-2">
                          <p className="text-xs text-orange-400 mb-1">Observações:</p>
                          <p className="text-sm text-gray-300">{saque.observacoes}</p>
                        </div>
                      )}
                      {saque.observacoes_admin && (
                        <div>
                          <p className="text-xs text-red-400 mb-1">Admin:</p>
                          <p className="text-sm text-gray-300">{saque.observacoes_admin}</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Saque - Apenas para usuários não-admin */}
      {user?.role !== 'admin' && (
        <SaqueModal
          open={saqueModal.isOpen}
          onOpenChange={saqueModal.setOpen}
          onSuccess={fetchSaques}
        />
      )}

      {/* Diálogo de Confirmação */}
      <ConfirmComponent />
    </div>
  )
} 