import React, { useState } from 'react'
import { Button } from '../ui/button'
import { useToast } from '../ui/toast'
import { X, Shield, Copy, Download, Eye, EyeOff, Check, QrCode } from 'lucide-react'

interface WireGuardConfigModalProps {
  isOpen: boolean
  onClose: () => void
  mikrotikId: string
  mikrotikName?: string
}

const WireGuardConfigModal: React.FC<WireGuardConfigModalProps> = ({
  isOpen,
  onClose,
  mikrotikId,
  mikrotikName = 'MikroTik'
}) => {
  const [loading, setLoading] = useState(false)
  const [configData, setConfigData] = useState<any>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeData, setQrCodeData] = useState('')
  const { addToast } = useToast()

  const generateConfig = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/mikrotik/wireguard/config/${mikrotikId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar configuração WireGuard')
      }

      setConfigData(data.data)
      setShowConfig(true)
      
      // Preparar dados para QR Code (formato padrão WireGuard)
      if (data.data.clientConfig) {
        setQrCodeData(data.data.clientConfig)
      }
      
      addToast({
        type: 'success',
        title: 'Configuração Gerada!',
        description: `Configuração WireGuard criada para ${mikrotikName}`
      })
    } catch (error) {
      console.error('Error generating WireGuard config:', error)
      addToast({
        type: 'error',
        title: 'Erro!',
        description: error instanceof Error ? error.message : 'Erro ao gerar configuração'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!configData?.mikrotikConfig) return

    try {
      await navigator.clipboard.writeText(configData.mikrotikConfig)
      setCopied(true)
      
      addToast({
        type: 'success',
        title: 'Copiado!',
        description: 'Configuração copiada para a área de transferência'
      })
      
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Falha ao copiar configuração'
      })
    }
  }

  const downloadConfig = () => {
    if (!configData?.mikrotikConfig) return

    const blob = new Blob([configData.mikrotikConfig], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mikrotik-${mikrotikId}-wireguard-config.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addToast({
      type: 'success',
      title: 'Download Iniciado!',
      description: 'Arquivo de configuração baixado'
    })
  }

  const generateQRCode = () => {
    if (!qrCodeData) {
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Dados do QR Code não disponíveis'
      })
      return
    }
    setShowQRCode(true)
  }

  const downloadQRCodeConfig = () => {
    if (!qrCodeData) return

    const blob = new Blob([qrCodeData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mikrotikName}-wireguard-client.conf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addToast({
      type: 'success',
      title: 'Download Iniciado!',
      description: 'Arquivo de configuração cliente baixado'
    })
  }

  const handleClose = () => {
    setConfigData(null)
    setShowConfig(false)
    setCopied(false)
    setShowQRCode(false)
    setQrCodeData('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-black rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-400" />
            <div>
              <h3 className="text-xl font-semibold text-white">
                Configuração WireGuard
              </h3>
              <p className="text-sm text-gray-400">
                {mikrotikName} (ID: {mikrotikId})
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="border-gray-600 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!showConfig ? (
          <div className="text-center py-8">
            <Shield className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">
              Configuração WireGuard para MikroTik
            </h4>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Gere automaticamente a configuração WireGuard completa para este MikroTik.
              Inclui todas as configurações necessárias: interface, peers, rotas, firewall e NAT.
            </p>
            
            <div className="bg-gray-900 rounded-lg p-4 mb-6 text-left">
              <h5 className="text-sm font-medium text-white mb-2">📋 O que será configurado:</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Interface WireGuard com chaves privadas</li>
                <li>• Peer do servidor com endpoint e chaves</li>
                <li>• Endereço IP do túnel</li>
                <li>• Rotas padrão via WireGuard</li>
                <li>• Regras de firewall (input/forward)</li>
                <li>• Configurações de NAT e Mangle</li>
              </ul>
            </div>

            <Button
              onClick={generateConfig}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Gerar Configuração
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Informações do Cliente */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h5 className="text-sm font-medium text-white mb-3">🔑 Informações do Cliente</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Nome do Cliente:</span>
                  <p className="text-white font-mono">{configData.client.clientName}</p>
                </div>
                <div>
                  <span className="text-gray-400">IP do Túnel:</span>
                  <p className="text-white font-mono">{configData.client.clientAddress}</p>
                </div>
                <div>
                  <span className="text-gray-400">Endpoint:</span>
                  <p className="text-white font-mono">{configData.client.serverEndpoint}:{configData.client.serverPort}</p>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 font-medium">✅ Ativo</span>
                </div>
              </div>
            </div>

            {/* Configuração MikroTik */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-sm font-medium text-white">📜 Configuração MikroTik (Copy & Paste)</h5>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfig(!showConfig)}
                    className="border-gray-600 text-gray-400 hover:text-white"
                  >
                    {showConfig ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadConfig}
                    className="border-gray-600 text-gray-400 hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={copyToClipboard}
                    className={copied ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
              </div>
              
              <div className="bg-black rounded border border-gray-700 p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {configData.mikrotikConfig}
                </pre>
              </div>
            </div>

            {/* QR Code Section */}
            {qrCodeData && (
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-white">📱 Configuração para Apps Móveis</h5>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadQRCodeConfig}
                      className="border-gray-600 text-gray-400 hover:text-white"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      .conf
                    </Button>
                    <Button
                      size="sm"
                      onClick={generateQRCode}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      QR Code
                    </Button>
                  </div>
                </div>
                
                {showQRCode ? (
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCodeData)}`}
                        alt="QR Code WireGuard"
                        className="w-64 h-64"
                      />
                    </div>
                    <p className="text-sm text-gray-400">
                      Escaneie com o app WireGuard no seu celular para conectar automaticamente
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <QrCode className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      Clique em "QR Code" para gerar o código de conexão para apps móveis
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Instruções */}
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <h5 className="text-sm font-medium text-yellow-400 mb-2">⚠️ Instruções Importantes</h5>
              <ol className="text-sm text-yellow-200 space-y-1 list-decimal list-inside">
                <li>Copie toda a configuração acima</li>
                <li>Acesse o terminal/Winbox do seu MikroTik</li>
                <li>Cole a configuração linha por linha ou execute em script</li>
                <li>Aguarde a aplicação completa de todas as configurações</li>
                <li>Verifique a conectividade após a configuração</li>
              </ol>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-gray-600 text-gray-400 hover:text-white"
              >
                Fechar
              </Button>
              <Button
                onClick={copyToClipboard}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Configuração
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WireGuardConfigModal