import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { useToast } from '../ui/toast'
import { X, Shield, Copy, Download, Check, Router, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

interface CreateMikrotikWithWireGuardModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  nome: string
  porcentagem: string
  username: string
  password: string
  port: string
  user_id: string
}

interface WireGuardPeer {
  publicKey: string
  privateKey: string
  presharedKey?: string
  allowedSubnets: string[]
  persistentKeepalive: number
}

interface TestStepProps {
  isActive: boolean
  isDone: boolean
  isError: boolean
  title: string
  description: string
}

const TestStep: React.FC<TestStepProps> = ({ isActive, isDone, isError, title, description }) => (
  <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
    isError ? 'border-red-600/30 bg-red-900/20' : 
    isDone ? 'border-green-600/30 bg-green-900/20' : 
    isActive ? 'border-blue-600/30 bg-blue-900/20' : 
    'border-gray-800 bg-gray-900'
  }`}>
    <div className="flex-shrink-0">
      {isActive && !isDone && !isError && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
      {isDone && !isError && <CheckCircle className="w-5 h-5 text-green-500" />}
      {isError && <XCircle className="w-5 h-5 text-red-500" />}
      {!isActive && !isDone && !isError && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
    </div>
    <div>
      <h4 className={`font-medium ${
        isError ? 'text-red-400' : 
        isDone ? 'text-green-400' : 
        isActive ? 'text-blue-400' : 
        'text-white'
      }`}>{title}</h4>
      <p className={`text-sm ${
        isError ? 'text-red-300' : 
        isDone ? 'text-green-300' : 
        isActive ? 'text-blue-300' : 
        'text-gray-400'
      }`}>{description}</p>
    </div>
  </div>
)

export const CreateMikrotikWithWireGuardModal: React.FC<CreateMikrotikWithWireGuardModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, session } = useAuthContext()
  const { addToast } = useToast()
  
  // Form states
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    porcentagem: '10',
    username: '',
    password: '',
    port: '8728',
    user_id: ''
  })
  
  // Process states
  const [currentStep, setCurrentStep] = useState<'form' | 'testing' | 'creating' | 'success'>('form')
  const [mikrotikConfig, setMikrotikConfig] = useState<string>('')
  const [, setWireguardPeer] = useState<WireGuardPeer | null>(null)
  const [extractedIP, setExtractedIP] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [userList, setUserList] = useState<any[]>([])
  const [testResults, setTestResults] = useState({
    wirerestTest: { status: 'idle', message: '' } as { status: 'idle' | 'testing' | 'success' | 'error', message: string },
    peerCreation: { status: 'idle', message: '' } as { status: 'idle' | 'creating' | 'success' | 'error', message: string },
    mikrotikSave: { status: 'idle', message: '' } as { status: 'idle' | 'saving' | 'success' | 'error', message: string }
  })
  const [error, setError] = useState<string>('')

  // Backend proxy configuration
  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const SERVER_ENDPOINT = '193.181.208.141'
  const SERVER_PORT = '64326'

  useEffect(() => {
    if (user?.role === 'admin' && isOpen) {
      fetchUsers()
    }
  }, [user, isOpen])

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('id, nome, email').order('nome')
    if (!error && data) setUserList(data)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validateForm = () => {
    const { nome, porcentagem, username, password } = formData
    const userId = user?.role === 'admin' ? formData.user_id : user?.id
    
    if (!nome || !porcentagem || !username || !password || !userId) {
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Preencha todos os campos obrigatórios'
      })
      return false
    }
    
    return true
  }

  const testWireRest = async () => {
    try {
      const token = session?.access_token || localStorage.getItem('token')
      const response = await fetch(`${BACKEND_URL}/api/mikrotik/wirerest/interface`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Backend proxy respondeu com status ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Erro ao testar WireRest:', error)
      throw error
    }
  }

  const createWireGuardPeer = async () => {
    try {
      const token = session?.access_token || localStorage.getItem('token')
      const response = await fetch(`${BACKEND_URL}/api/mikrotik/wirerest/peers`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Falha ao criar peer: ${response.status}`)
      }

      const peer = await response.json()
      return peer
    } catch (error) {
      console.error('Erro ao criar peer WireGuard:', error)
      throw error
    }
  }

  const generateMikroTikConfig = async (peer: WireGuardPeer, clientIP: string) => {
    const interfaceName = `wg-client`
    
    // Obter chave pública do servidor WireRest via proxy
    let serverPublicKey = 'CHAVE_PUBLICA_DO_SERVIDOR' // fallback
    try {
      const token = session?.access_token || localStorage.getItem('token')
      const serverResponse = await fetch(`${BACKEND_URL}/api/mikrotik/wirerest/interface`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (serverResponse.ok) {
        const serverData = await serverResponse.json()
        serverPublicKey = serverData.publicKey
      }
    } catch (error) {
      console.warn('Não foi possível obter chave pública do servidor, usando placeholder')
    }
    
    return `/interface/wireguard
add name="${interfaceName}" private-key="${peer.privateKey}" listen-port=64326 comment="MikroPix - Conexão"
/interface/wireguard/peers
add interface="${interfaceName}" public-key="${serverPublicKey}" preshared-key="${peer.presharedKey || ''}" allowed-address="0.0.0.0/0,::/0" endpoint-address="${SERVER_ENDPOINT}" endpoint-port="${SERVER_PORT}" persistent-keepalive="25s" comment="MikroPix - Conexão"
/ip/address
add address="${clientIP}/24" interface="${interfaceName}" comment="MikroPix - Conexão"
/ip/dns
set servers="1.1.1.1" allow-remote-requests=yes
/ip/firewall/filter
add chain="input" protocol="udp" port="64326" action="accept" comment="MikroPix - Conexão"
add chain="forward" out-interface="${interfaceName}" action="accept" comment="MikroPix - Conexão"
add chain="forward" in-interface="${interfaceName}" action="accept" comment="MikroPix - Conexão"
/ip/firewall/nat
add chain="srcnat" out-interface="${interfaceName}" action="masquerade" comment="MikroPix - Conexão"
/ip/firewall/mangle
add chain="prerouting" in-interface="${interfaceName}" action="mark-connection" new-connection-mark="wireguard-conn" comment="MikroPix - Conexão"
add chain="prerouting" connection-mark="wireguard-conn" action="mark-packet" new-packet-mark="wireguard-packet" comment="MikroPix - Conexão"
/interface/wireguard
set [find name="${interfaceName}"] disabled=no

# Configuração gerada automaticamente via WireRest
# Servidor: ${SERVER_ENDPOINT}:${SERVER_PORT}
# Peer Client IP: ${clientIP}
# Chave Pública do Servidor: ${serverPublicKey}`
  }

  const handleCreateConnection = async () => {
    if (!validateForm()) return

    try {
      setCurrentStep('testing')
      setError('')
      
      // Teste 1: Conectividade com WireRest
      setTestResults(prev => ({
        ...prev,
        wirerestTest: { status: 'testing', message: 'Testando conectividade com WireRest...' }
      }))

      await testWireRest()
      
      setTestResults(prev => ({
        ...prev,
        wirerestTest: { status: 'success', message: 'WireRest conectado com sucesso!' }
      }))

      // Passo 2: Criar peer WireGuard
      setCurrentStep('creating')
      setTestResults(prev => ({
        ...prev,
        peerCreation: { status: 'creating', message: 'Criando peer WireGuard...' }
      }))

      const peer = await createWireGuardPeer()
      
      // Extrair IP do allowedSubnets
      const clientIP = peer.allowedSubnets[0]?.split('/')[0]
      if (!clientIP) {
        throw new Error('Não foi possível extrair IP do peer criado')
      }

      setWireguardPeer(peer)
      setExtractedIP(clientIP)
      
      setTestResults(prev => ({
        ...prev,
        peerCreation: { status: 'success', message: `Peer criado! IP: ${clientIP}` }
      }))

      // Passo 3: Salvar no Supabase
      setTestResults(prev => ({
        ...prev,
        mikrotikSave: { status: 'saving', message: 'Salvando MikroTik no banco de dados...' }
      }))

      const userId = user?.role === 'admin' ? formData.user_id : user?.id
      const mikrotikId = uuidv4()
      
      const { error: supabaseError } = await supabase.from('mikrotiks').insert({
        id: mikrotikId,
        nome: formData.nome,
        porcentagem: parseFloat(formData.porcentagem),
        user_id: userId,
        token: uuidv4(),
        ip: clientIP,
        username: formData.username,
        password: formData.password,
        port: parseInt(formData.port) || 8728,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Dados do WireGuard
        wireguard_public_key: peer.publicKey,
        wireguard_private_key: peer.privateKey,
        wireguard_preshared_key: peer.presharedKey,
        wireguard_allowed_subnets: peer.allowedSubnets.join(','),
        wireguard_keepalive: peer.persistentKeepalive
      })

      if (supabaseError) {
        throw new Error(`Erro ao salvar no banco: ${supabaseError.message}`)
      }

      // Gerar configuração MikroTik
      const config = await generateMikroTikConfig(peer, clientIP)
      setMikrotikConfig(config)

      setTestResults(prev => ({
        ...prev,
        mikrotikSave: { status: 'success', message: 'MikroTik salvo com sucesso!' }
      }))

      setCurrentStep('success')
      
      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'MikroTik com WireGuard criado com sucesso!'
      })

    } catch (error: any) {
      console.error('Erro ao criar conexão:', error)
      setError(error.message || 'Erro desconhecido')
      
      // Marcar o passo atual como erro
      if (currentStep === 'testing') {
        setTestResults(prev => ({
          ...prev,
          wirerestTest: { status: 'error', message: error.message }
        }))
      } else if (currentStep === 'creating') {
        setTestResults(prev => ({
          ...prev,
          peerCreation: { status: 'error', message: error.message }
        }))
      }
      
      addToast({
        type: 'error',
        title: 'Erro!',
        description: error.message || 'Erro ao criar conexão'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mikrotikConfig)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      addToast({
        type: 'success',
        title: 'Copiado!',
        description: 'Configuração copiada para a área de transferência'
      })
    } catch (error) {
      console.error('Erro ao copiar:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Não foi possível copiar o texto'
      })
    }
  }

  const downloadConfig = () => {
    const blob = new Blob([mikrotikConfig], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mikrotik-wireguard-${formData.nome.replace(/\s+/g, '-').toLowerCase()}.rsc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFinish = () => {
    resetModal()
    onSuccess()
    onClose()
  }

  const resetModal = () => {
    setFormData({
      nome: '',
      porcentagem: '10',
      username: '',
      password: '',
      port: '8728',
      user_id: ''
    })
    setCurrentStep('form')
    setMikrotikConfig('')
    setWireguardPeer(null)
    setExtractedIP('')
    setLoading(false)
    setCopied(false)
    setTestResults({
      wirerestTest: { status: 'idle', message: '' },
      peerCreation: { status: 'idle', message: '' },
      mikrotikSave: { status: 'idle', message: '' }
    })
    setError('')
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-black border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-900 border border-gray-800 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Criar MikroTik com WireGuard</h2>
              <p className="text-sm text-gray-400">Integração completa com WireRest</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {currentStep === 'form' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Router className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Configurar Novo MikroTik</h3>
                <p className="text-gray-400">Preencha os dados para criar o MikroTik e peer WireGuard automaticamente</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateConnection(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Nome do MikroTik *
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Matriz São Paulo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Porcentagem *
                    </label>
                    <input
                      type="number"
                      name="porcentagem"
                      value={formData.porcentagem}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="10"
                      min="0"
                      max="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Usuário MikroTik *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="admin"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Senha MikroTik *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Senha do MikroTik"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Porta API
                    </label>
                    <input
                      type="number"
                      name="port"
                      value={formData.port}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="8728"
                      min="1"
                      max="65535"
                    />
                  </div>

                  {user?.role === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Usuário do Sistema *
                      </label>
                      <select
                        name="user_id"
                        value={formData.user_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Selecione um usuário</option>
                        {userList.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.nome} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {extractedIP && (
                  <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                    <p className="text-green-400">
                      <strong>IP WireGuard:</strong> {extractedIP}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Conexão'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {currentStep === 'testing' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Testando Conectividade</h3>
                <p className="text-gray-400">Verificando se o WireRest está funcionando</p>
              </div>

              <div className="space-y-4">
                <TestStep
                  isActive={testResults.wirerestTest.status === 'testing'}
                  isDone={testResults.wirerestTest.status === 'success'}
                  isError={testResults.wirerestTest.status === 'error'}
                  title="Conectividade WireRest"
                  description={testResults.wirerestTest.message}
                />
              </div>
            </div>
          )}

          {currentStep === 'creating' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Criando Conexão</h3>
                <p className="text-gray-400">Criando peer WireGuard e salvando no banco</p>
              </div>

              <div className="space-y-4">
                <TestStep
                  isActive={false}
                  isDone={testResults.wirerestTest.status === 'success'}
                  isError={testResults.wirerestTest.status === 'error'}
                  title="Conectividade WireRest"
                  description={testResults.wirerestTest.message}
                />
                <TestStep
                  isActive={testResults.peerCreation.status === 'creating'}
                  isDone={testResults.peerCreation.status === 'success'}
                  isError={testResults.peerCreation.status === 'error'}
                  title="Criação do Peer"
                  description={testResults.peerCreation.message}
                />
                <TestStep
                  isActive={testResults.mikrotikSave.status === 'saving'}
                  isDone={testResults.mikrotikSave.status === 'success'}
                  isError={testResults.mikrotikSave.status === 'error'}
                  title="Salvando no Banco"
                  description={testResults.mikrotikSave.message}
                />
              </div>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Sucesso!</h3>
                <p className="text-gray-400">MikroTik e peer WireGuard criados com sucesso</p>
              </div>

              {mikrotikConfig && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">Configuração MikroTik</h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex items-center space-x-2"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadConfig}
                        className="flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap">{mikrotikConfig}</pre>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-400 mb-2">Instruções:</h5>
                    <ol className="list-decimal list-inside space-y-1 text-blue-300 text-sm">
                      <li>Copie o código acima</li>
                      <li>Acesse o terminal do MikroTik</li>
                      <li>Cole e execute os comandos</li>
                      <li>Verifique se a interface WireGuard foi criada</li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                >
                  Fechar
                </Button>
                <Button
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Finalizar
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateMikrotikWithWireGuardModal