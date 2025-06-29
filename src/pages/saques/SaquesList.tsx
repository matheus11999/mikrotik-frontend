import { useEffect, useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { TrendingUp, Search, Clock, CheckCircle, XCircle, Calendar, User, DollarSign, Plus, AlertCircle, ArrowDown } from 'lucide-react'

interface Saque {
  id: string
  valor: number
  status: 'pendente' | 'aprovado' | 'rejeitado'
  metodo_pagamento: string
  dados_bancarios: string
  observacoes?: string
  created_at: string
  processed_at?: string
  user_id: string
  users?: {
    nome: string
    email: string
  }
}

export function SaquesList() {
  const { user } = useAuthContext()
  const [saques, setSaques] = useState<Saque[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewSaque, setShowNewSaque] = useState(false)
  const [newSaque, setNewSaque] = useState({
    valor: '',
    metodo_pagamento: 'pix',
    dados_bancarios: '',
    observacoes: ''
  })

  useEffect(() => {
    fetchSaques()
  }, [user])

  const fetchSaques = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('saques')
        .select(`
          *,
          users (
            nome,
            email
          )
        `)

      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setSaques(data || [])
    } catch (error) {
      console.error('Error fetching saques:', error)
      // Dados mockados para demonstração
      setSaques([
        {
          id: '1',
          valor: 150.00,
          status: 'aprovado',
          metodo_pagamento: 'pix',
          dados_bancarios: 'usuario@email.com',
          created_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
          user_id: user?.id || '',
          users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
        },
        {
          id: '2',
          valor: 75.50,
          status: 'pendente',
          metodo_pagamento: 'ted',
          dados_bancarios: 'Banco do Brasil - Ag: 1234-5 - CC: 12345-6',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: user?.id || '',
          users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
        },
        {
          id: '3',
          valor: 200.00,
          status: 'rejeitado',
          metodo_pagamento: 'pix',
          dados_bancarios: 'usuario2@email.com',
          observacoes: 'Dados bancários incorretos',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          processed_at: new Date(Date.now() - 172800000 + 3600000).toISOString(),
          user_id: user?.id || '',
          users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSaque = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || parseFloat(newSaque.valor) > (user.saldo || 0)) {
      alert('Saldo insuficiente')
      return
    }

    try {
      // Aqui você faria a inserção no Supabase
      console.log('Novo saque:', newSaque)
      
      // Mock: adiciona o saque à lista
      const novoSaque: Saque = {
        id: Date.now().toString(),
        valor: parseFloat(newSaque.valor),
        status: 'pendente',
        metodo_pagamento: newSaque.metodo_pagamento,
        dados_bancarios: newSaque.dados_bancarios,
        observacoes: newSaque.observacoes,
        created_at: new Date().toISOString(),
        user_id: user.id,
        users: { nome: user.nome, email: user.email }
      }
      
      setSaques([novoSaque, ...saques])
      setNewSaque({ valor: '', metodo_pagamento: 'pix', dados_bancarios: '', observacoes: '' })
      setShowNewSaque(false)
    } catch (error) {
      console.error('Error creating saque:', error)
    }
  }

  const filteredSaques = saques.filter(saque => 
          (saque.dados_bancarios || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (saque.metodo_pagamento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (saque.users?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
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
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-800 rounded-lg w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded w-96 animate-pulse"></div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-black rounded-xl animate-pulse"></div>
            ))}
          </div>
          
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-black rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
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

              <Button
                onClick={() => setShowNewSaque(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Solicitar Saque
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* New Saque Form */}
          {showNewSaque && (
            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Solicitar Novo Saque</h3>
              
              <form onSubmit={handleSubmitSaque} className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Valor (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newSaque.valor}
                      onChange={(e) => setNewSaque({ ...newSaque, valor: e.target.value })}
                      placeholder="0.00"
                      max={user?.saldo || 0}
                      className="bg-gray-900 border-gray-800 text-white text-base"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Saldo disponível: R$ {user?.saldo?.toFixed(2) || '0.00'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Método de Pagamento</label>
                    <select
                      value={newSaque.metodo_pagamento}
                      onChange={(e) => setNewSaque({ ...newSaque, metodo_pagamento: e.target.value })}
                      className="w-full p-3 bg-gray-900 border border-gray-800 text-white rounded-lg text-base"
                      required
                    >
                      <option value="pix">PIX</option>
                      <option value="ted">TED</option>
                      <option value="doc">DOC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Dados para Recebimento</label>
                  <Input
                    value={newSaque.dados_bancarios}
                    onChange={(e) => setNewSaque({ ...newSaque, dados_bancarios: e.target.value })}
                    placeholder={newSaque.metodo_pagamento === 'pix' ? 'email@exemplo.com ou chave PIX' : 'Banco - Agência - Conta'}
                    className="bg-gray-900 border-gray-800 text-white text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Observações (opcional)</label>
                  <Input
                    value={newSaque.observacoes}
                    onChange={(e) => setNewSaque({ ...newSaque, observacoes: e.target.value })}
                    placeholder="Informações adicionais..."
                    className="bg-gray-900 border-gray-800 text-white text-base"
                  />
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewSaque(false)}
                    className="flex-1 border-gray-800 text-gray-300 hover:text-white py-3"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3"
                  >
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Solicitar Saque
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por dados bancários, método ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(saque.status)}`}>
                          {getStatusIcon(saque.status)}
                          <span className="capitalize">{saque.status}</span>
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
                        <p className="text-white break-all">{saque.dados_bancarios}</p>
                      </div>

                      {/* User Info - Only for admin */}
                      {user?.role === 'admin' && saque.users && (
                        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-purple-400" />
                            <span className="text-purple-400 text-sm font-medium">Usuário</span>
                          </div>
                          <p className="text-white font-medium">{saque.users.nome}</p>
                          <p className="text-xs text-gray-400">{saque.users.email}</p>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 