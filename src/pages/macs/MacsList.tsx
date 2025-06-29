import { useEffect, useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { DollarSign, Search, Wifi, Calendar, User, Router, Plus, Copy, Eye, EyeOff, CheckCircle } from 'lucide-react'

interface Mac {
  id: string
  mac_address: string
  preco: number
  vendido: boolean
  data_venda?: string
  created_at: string
  updated_at: string
  mikrotik_id?: string
  user_id?: string
  users?: {
    nome: string
    email: string
  }
  mikrotiks?: {
    nome: string
    porcentagem: number
  }
}

export function MacsList() {
  const { user } = useAuthContext()
  const [macs, setMacs] = useState<Mac[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewMac, setShowNewMac] = useState(false)
  const [showMacAddresses, setShowMacAddresses] = useState<{ [key: string]: boolean }>({})
  const [newMac, setNewMac] = useState({
    mac_address: '',
    preco: '',
    mikrotik_id: ''
  })
  const [mikrotiks, setMikrotiks] = useState<any[]>([])
  const [copiedMac, setCopiedMac] = useState<string | null>(null)

  useEffect(() => {
    fetchMacs()
    fetchMikrotiks()
  }, [user])

  const fetchMacs = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('macs')
        .select(`
          *,
          mikrotiks (
            nome,
            porcentagem
          )
        `)

      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      
      // Enriquecer os dados com informações do usuário atual
      const enrichedData = data?.map(mac => ({
        ...mac,
        users: {
          nome: user.nome,
          email: user.email
        }
      })) || []
      
      setMacs(enrichedData)
    } catch (error) {
      console.error('Error fetching macs:', error)
      // Dados mockados para demonstração
      setMacs([
        {
          id: '1',
          mac_address: '00:11:22:33:44:55',
          preco: 25.00,
          vendido: true,
          data_venda: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          mikrotik_id: '1',
          user_id: user?.id || '',
          users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' },
          mikrotiks: { nome: 'MikroTik Principal', porcentagem: 10 }
        },
        {
          id: '2',
          mac_address: 'AA:BB:CC:DD:EE:FF',
          preco: 30.00,
          vendido: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          mikrotik_id: '1',
          user_id: user?.id || '',
          users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' },
          mikrotiks: { nome: 'MikroTik Principal', porcentagem: 10 }
        },
        {
          id: '3',
          mac_address: '12:34:56:78:90:AB',
          preco: 20.00,
          vendido: true,
          data_venda: new Date(Date.now() - 172800000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          mikrotik_id: '2',
          user_id: user?.id || '',
          users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' },
          mikrotiks: { nome: 'MikroTik Secundário', porcentagem: 15 }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchMikrotiks = async () => {
    try {
      let query = supabase.from('mikrotiks').select('id, nome')
      
      if (user?.role !== 'admin') {
        query = query.eq('user_id', user?.id)
      }

      const { data, error } = await query

      if (error) throw error
      setMikrotiks(data || [])
    } catch (error) {
      console.error('Error fetching mikrotiks:', error)
      // Mock data
      setMikrotiks([
        { id: '1', nome: 'MikroTik Principal' },
        { id: '2', nome: 'MikroTik Secundário' }
      ])
    }
  }

  const generateRandomMac = () => {
    const hex = '0123456789ABCDEF'
    let mac = ''
    for (let i = 0; i < 6; i++) {
      if (i > 0) mac += ':'
      mac += hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)]
    }
    return mac
  }

  const handleSubmitMac = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Aqui você faria a inserção no Supabase
      console.log('Novo MAC:', newMac)
      
      // Mock: adiciona o MAC à lista
      const novoMac: Mac = {
        id: Date.now().toString(),
        mac_address: newMac.mac_address,
        preco: parseFloat(newMac.preco),
        vendido: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        mikrotik_id: newMac.mikrotik_id,
        user_id: user?.id || '',
        users: { nome: user?.nome || 'Usuário', email: user?.email || 'usuario@email.com' },
        mikrotiks: mikrotiks.find(m => m.id === newMac.mikrotik_id)
      }
      
      setMacs([novoMac, ...macs])
      setNewMac({ mac_address: '', preco: '', mikrotik_id: '' })
      setShowNewMac(false)
    } catch (error) {
      console.error('Error creating mac:', error)
    }
  }

  const copyToClipboard = (mac: string) => {
    navigator.clipboard.writeText(mac)
    setCopiedMac(mac)
    setTimeout(() => setCopiedMac(null), 2000)
  }

  const toggleMacVisibility = (macId: string) => {
    setShowMacAddresses(prev => ({
      ...prev,
      [macId]: !prev[macId]
    }))
  }

  const filteredMacs = macs.filter(mac => 
          (mac.mac_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mac.mikrotiks?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mac.users?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalMacs = macs.length
  const macsVendidos = macs.filter(m => m.vendido).length
  const macsDisponiveis = macs.filter(m => !m.vendido).length
  const totalReceita = macs.filter(m => m.vendido).reduce((sum, m) => sum + m.preco, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-800 rounded-lg w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded w-96 animate-pulse"></div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
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
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-white">
                    Endereços MAC
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">Gerencie os endereços MAC para venda</p>
                </div>
              </div>

              <Button
                onClick={() => setShowNewMac(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo MAC
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* New MAC Form */}
          {showNewMac && (
            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Adicionar Novo MAC</h3>
              
              <form onSubmit={handleSubmitMac} className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Endereço MAC</label>
                    <div className="flex space-x-2">
                      <Input
                        value={newMac.mac_address}
                        onChange={(e) => setNewMac({ ...newMac, mac_address: e.target.value })}
                        placeholder="00:11:22:33:44:55"
                        className="bg-gray-900 border-gray-800 text-white text-base"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setNewMac({ ...newMac, mac_address: generateRandomMac() })}
                        className="border-gray-800 text-gray-300 hover:text-white px-3 shrink-0"
                        title="Gerar MAC aleatório"
                      >
                        <Wifi className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Preço (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newMac.preco}
                      onChange={(e) => setNewMac({ ...newMac, preco: e.target.value })}
                      placeholder="25.00"
                      className="bg-gray-900 border-gray-800 text-white text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">MikroTik</label>
                    <select
                      value={newMac.mikrotik_id}
                      onChange={(e) => setNewMac({ ...newMac, mikrotik_id: e.target.value })}
                      className="w-full p-3 bg-gray-900 border border-gray-800 text-white rounded-lg text-base"
                      required
                    >
                      <option value="">Selecione um MikroTik</option>
                      {mikrotiks.map((mikrotik) => (
                        <option key={mikrotik.id} value={mikrotik.id}>
                          {mikrotik.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewMac(false)}
                    className="flex-1 border-gray-800 text-gray-300 hover:text-white py-3"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Adicionar MAC
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por MAC, MikroTik ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 sm:py-4 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-base sm:text-lg"
            />
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-xs sm:text-sm font-medium mb-1">Total MACs</p>
                  <p className="text-xl sm:text-3xl font-bold text-white">{totalMacs}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <Wifi className="h-4 w-4 sm:h-6 sm:w-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-xs sm:text-sm font-medium mb-1">Vendidos</p>
                  <p className="text-xl sm:text-3xl font-bold text-white">{macsVendidos}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-xs sm:text-sm font-medium mb-1">Disponíveis</p>
                  <p className="text-xl sm:text-3xl font-bold text-white">{macsDisponiveis}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-400 text-xs sm:text-sm font-medium mb-1">Receita</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">R$ {totalReceita.toFixed(2)}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* MACs List */}
          {filteredMacs.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
                  <Wifi className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {macs.length === 0 ? 'Nenhum MAC encontrado' : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-gray-400 text-lg">
                  {macs.length === 0 
                    ? 'Adicione endereços MAC para começar as vendas'
                    : 'Tente ajustar os termos de busca'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMacs.map((mac, index) => (
                <div
                  key={mac.id}
                  className={`group bg-black border rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer ${
                    mac.vendido 
                      ? 'border-green-500/30 hover:border-green-500/50' 
                      : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900'
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gray-900 border border-gray-800 ${
                          mac.vendido ? 'ring-2 ring-green-500/20' : ''
                        }`}>
                          <Wifi className={`h-5 w-5 ${mac.vendido ? 'text-green-400' : 'text-purple-400'}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                            MAC #{mac.id.slice(0, 6)}
                          </h3>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            mac.vendido 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}>
                            {mac.vendido ? 'Vendido' : 'Disponível'}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-2xl font-bold text-purple-400">R$ {mac.preco.toFixed(2)}</p>
                    </div>

                    {/* MAC Address */}
                    <div className="mb-4 p-3 rounded-lg bg-gray-900 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-400 text-sm font-medium">Endereço MAC</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleMacVisibility(mac.id)}
                            className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                            title={showMacAddresses[mac.id] ? 'Ocultar MAC' : 'Mostrar MAC'}
                          >
                            {showMacAddresses[mac.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(mac.mac_address)}
                            className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                            title="Copiar MAC"
                          >
                            {copiedMac === mac.mac_address ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-white font-mono">
                        {showMacAddresses[mac.id] ? mac.mac_address : '••:••:••:••:••:••'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* MikroTik */}
                      {mac.mikrotiks && (
                        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                          <div className="flex items-center space-x-2 mb-1">
                            <Router className="h-3 w-3 text-orange-400" />
                            <span className="text-orange-400 text-xs font-medium">MikroTik</span>
                          </div>
                          <p className="text-white text-sm font-medium">{mac.mikrotiks.nome}</p>
                        </div>
                      )}

                      {/* Data */}
                      <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-400 text-xs font-medium">
                            {mac.vendido ? 'Vendido em' : 'Criado em'}
                          </span>
                        </div>
                        <p className="text-white text-sm">
                          {new Date(mac.vendido ? mac.data_venda! : mac.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* User Info - Only for admin */}
                    {user?.role === 'admin' && mac.users && (
                      <div className="mt-4 p-3 rounded-lg bg-gray-900 border border-gray-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-purple-400" />
                          <span className="text-purple-400 text-sm font-medium">Usuário</span>
                        </div>
                        <p className="text-white font-medium">{mac.users.nome}</p>
                        <p className="text-xs text-gray-400">{mac.users.email}</p>
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