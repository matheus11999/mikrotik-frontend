import { useEffect, useState } from 'react'
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
import { TrendingUp, Search, Clock, CheckCircle, XCircle, Calendar, User, DollarSign, Plus, AlertCircle, RefreshCw, Zap } from 'lucide-react'

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

  const filteredSaques = saques.filter(saque => 
          (saque.dados_bancarios || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (saque.metodo_pagamento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (saque.user?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    <div className="min-h-screen bg-black pt-16 lg:pt-0">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-white">
                    Saques
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">Solicitações de saque e histórico</p>
                </div>
              </div>

              {user?.role !== 'admin' && (
                <Button
                  onClick={saqueModal.open}
                  className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Solicitar Saque
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

          {/* Saque Automático Switch - Apenas para usuários não-admin */}
          {user?.role !== 'admin' && (
            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                    <Zap className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Saque Automático</h3>
                    <p className="text-gray-400 text-sm">
                      Solicitar saque automaticamente ao atingir R$ 50,00
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
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">
                      Configure sua chave PIX padrão no perfil para ativar o saque automático
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por dados bancários, método ou usuário..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 sm:py-4 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl text-base sm:text-lg"
            />
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-400 text-xs sm:text-sm font-medium mb-1">Total Sacado</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">R$ {totalSaques.toFixed(2)}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 text-xs sm:text-sm font-medium mb-1">Pendentes</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{saquesPendentes}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-xs sm:text-sm font-medium mb-1">Aprovados</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{saquesAprovados}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Saques List */}
          {filteredSaques.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
                  <TrendingUp className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {saques.length === 0 ? 'Nenhum saque encontrado' : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-gray-400 text-lg">
                  {saques.length === 0 
                    ? 'Faça sua primeira solicitação de saque'
                    : 'Tente ajustar os termos de busca'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSaques.map((saque, index) => (
                <div
                  key={saque.id}
                  className="group bg-black border border-gray-800 hover:border-gray-700 hover:bg-gray-900 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                          <TrendingUp className="h-6 w-6 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                            Saque #{saque.id.slice(0, 8)}
                          </h3>
                          <p className="text-gray-400">
                            {new Date(saque.created_at).toLocaleDateString('pt-BR', {
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
                        <p className="text-2xl font-bold text-orange-400">R$ {saque.valor.toFixed(2)}</p>
                        <div className="flex flex-col space-y-1 items-end">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(saque.status)}`}>
                            {getStatusIcon(saque.status)}
                            <span className="capitalize">{saque.status}</span>
                          </div>
                          {saque.automatico && (
                            <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border border-orange-500/30 bg-orange-500/10 text-orange-400">
                              <Zap className="h-3 w-3" />
                              <span>Automático</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* Método de Pagamento */}
                      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <span className="text-blue-400 text-sm font-medium">Método</span>
                        </div>
                        <p className="text-white font-medium uppercase">{saque.metodo_pagamento}</p>
                      </div>

                      {/* Dados Bancários */}
                      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-green-400 text-sm font-medium">Dados Bancários</span>
                        </div>
                        {saque.metodo_pagamento === 'pix' ? (
                          <p className="text-white break-all">{saque.chave_pix}</p>
                        ) : (
                          <div className="text-white space-y-1">
                            <p><span className="text-gray-400">Banco:</span> {saque.dados_bancarios?.banco}</p>
                            <p><span className="text-gray-400">Agência:</span> {saque.dados_bancarios?.agencia}</p>
                            <p><span className="text-gray-400">Conta:</span> {saque.dados_bancarios?.conta}</p>
                            <p><span className="text-gray-400">Titular:</span> {saque.dados_bancarios?.titular}</p>
                          </div>
                        )}
                      </div>

                      {/* User Info - Only for admin */}
                      {user?.role === 'admin' && saque.user && (
                        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-purple-400" />
                            <span className="text-purple-400 text-sm font-medium">Usuário</span>
                          </div>
                          <p className="text-white font-medium">{saque.user.nome}</p>
                          <p className="text-xs text-gray-400">{saque.user.email}</p>
                        </div>
                      )}
                    </div>

                    {/* Observações */}
                    {saque.observacoes && (
                      <div className="mt-4 p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-orange-400" />
                          <span className="text-orange-400 text-sm font-medium">Observações</span>
                        </div>
                        <p className="text-white">{saque.observacoes}</p>
                      </div>
                    )}

                    {/* Data de Processamento */}
                    {saque.processed_at && (
                      <div className="mt-4 p-4 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-400 text-sm font-medium">Processado em</span>
                        </div>
                        <p className="text-white">
                          {new Date(saque.processed_at).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}

                    {/* Admin Controls - Only for admin and pending saques */}
                    {user?.role === 'admin' && saque.status === 'pendente' && (
                      <div className="mt-4 flex space-x-3">
                        <Button
                          onClick={() => handleApproveSaque(saque.id)}
                          disabled={processingAction === saque.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processingAction === saque.id ? (
                            <InlineLoader size="sm" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => handleRejectSaque(saque.id)}
                          disabled={processingAction === saque.id}
                          variant="destructive"
                          className="flex-1"
                        >
                          {processingAction === saque.id ? (
                            <InlineLoader size="sm" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Rejeitar
                        </Button>
                      </div>
                    )}

                    {/* Admin Observations */}
                    {saque.observacoes_admin && (
                      <div className="mt-4 p-4 rounded-lg bg-red-900/20 border border-red-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-red-400" />
                          <span className="text-red-400 text-sm font-medium">Observações do Admin</span>
                        </div>
                        <p className="text-white">{saque.observacoes_admin}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Saque */}
      <SaqueModal
        open={saqueModal.isOpen}
        onOpenChange={saqueModal.setOpen}
        onSuccess={fetchSaques}
      />

      {/* Diálogo de Confirmação */}
      <ConfirmComponent />
    </div>
  )
} 