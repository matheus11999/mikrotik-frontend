import { useState, useEffect } from 'react'
import { X, Crown, Check, Star, Zap, TrendingUp, Shield, Globe, BarChart, Palette, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Modal } from './ui/modal'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../contexts/AuthContext'
import { api } from '../config/api'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  duration_days: number
  max_mikrotiks: number
  features: {
    vendas_comissao: number
    relatorios: boolean
    customizacao: boolean
    suporte: string
    senhas_hotspot?: boolean
    relatorio_vendas?: boolean
    relatorio_financeiro?: boolean
  }
  active: boolean
}

interface UserSubscription {
  id: string
  plan_id: string
  starts_at: string
  expires_at: string
  status: 'active' | 'expired' | 'cancelled'
  subscription_plans: SubscriptionPlan
}

interface PlanoModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan?: UserSubscription | null
}

interface PaymentData {
  payment_id: string
  qr_code: string
  pix_code: string
  amount: number
  expires_at: string
}

export function PlanoModal({ isOpen, onClose, currentPlan }: PlanoModalProps) {
  const { user } = useAuthContext()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  console.log('PlanoModal render - isOpen:', isOpen, 'user:', user?.id)

  // Log when modal opens/closes
  useEffect(() => {
    console.log('PlanoModal isOpen changed:', isOpen)
    if (isOpen) {
      console.log('Modal is opening, starting to fetch plans...')
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchPlans()
    }
  }, [isOpen])

  const fetchPlans = async () => {
    try {
      console.log('Fetching subscription plans...')
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true })

      console.log('Plans query result:', { data, error })

      if (error) throw error

      // Filtrar planos - SEMPRE remover plano gratuito da modal (conforme solicitado)
      let filteredPlans = data.filter(plan => 
        !plan.name.toLowerCase().includes('grátis') && 
        !plan.name.toLowerCase().includes('teste') &&
        plan.price > 0
      )

      console.log('Filtered plans (no free plans):', filteredPlans)
      setPlans(filteredPlans)
    } catch (error) {
      console.error('Error fetching plans:', error)
      
      // Fallback plans em caso de erro ou tabelas não existentes (SEM planos gratuitos)
      const fallbackPlans: SubscriptionPlan[] = [
        {
          id: 'fallback-basic',
          name: 'Básico',
          description: 'Plano básico - Temporário',
          price: 19.90,
          duration_days: 30,
          max_mikrotiks: 3,
          features: {
            vendas_comissao: 18,
            relatorios: true,
            customizacao: false,
            suporte: 'email',
            senhas_hotspot: true
          },
          active: true
        },
        {
          id: 'fallback-pro',
          name: 'Pro',
          description: 'Plano profissional - Temporário',
          price: 39.90,
          duration_days: 30,
          max_mikrotiks: 10,
          features: {
            vendas_comissao: 20,
            relatorios: true,
            customizacao: true,
            suporte: 'prioritário',
            senhas_hotspot: true,
            relatorio_vendas: true,
            relatorio_financeiro: true
          },
          active: true
        }
      ]
      
      console.log('Using fallback plans:', fallbackPlans)
      setPlans(fallbackPlans)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    console.log('Selecting plan:', plan)
    
    if (plan.price === 0) {
      // Plano gratuito - ativar diretamente
      console.log('Activating free plan')
      await activateFreePlan(plan)
      return
    }

    setProcessingPayment(true)
    try {
      console.log('Creating payment for plan:', plan.id)
      
      // Verificar se o backend está rodando
      try {
        const healthCheck = await api.health()
        console.log('Backend health check OK:', healthCheck)
      } catch (healthError) {
        console.error('Backend health check failed:', healthError)
        alert('⚠️ Servidor backend offline. Verifique se o servidor está rodando.')
        setProcessingPayment(false)
        return
      }
      
      // Adicionar delay para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const response = await api.subscription.createPayment({
        plan_id: plan.id
      })

      console.log('Payment response:', response)

      if (response.success) {
        setPaymentData(response.data)
        setShowPayment(true)
      } else {
        throw new Error(response.message || 'Erro ao criar pagamento')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      
      // Verificar diferentes tipos de erro
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          alert('🔐 Erro de autenticação. Por favor, faça login novamente.')
          window.location.href = '/login'
        } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          alert('🌐 Erro de conexão com https://api.mikropix.online. Verifique se o servidor backend está rodando e se há conexão com a internet.')
        } else {
          alert(`❌ Erro ao criar pagamento: ${error.message}`)
        }
      } else {
        alert('❌ Erro desconhecido ao criar pagamento. Tente novamente.')
      }
    } finally {
      setProcessingPayment(false)
    }
  }

  const activateFreePlan = async (plan: SubscriptionPlan) => {
    try {
      console.log('Activating free plan for user:', user?.id, 'plan:', plan.id)
      
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days)

      console.log('Expires at:', expiresAt.toISOString())

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user?.id,
          plan_id: plan.id,
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select()

      console.log('Free plan activation result:', { data, error })

      if (error) throw error

      console.log('Free plan activated successfully!')
      alert('Plano gratuito ativado com sucesso!')
      onClose()
      
      // Recarregar a página para atualizar os dados
      window.location.reload()
    } catch (error) {
      console.error('Error activating free plan:', error)
      alert(`Erro ao ativar plano gratuito: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Código PIX copiado!')
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Teste Grátis':
        return <Star className="h-6 w-6" />
      case 'Pro':
        return <Crown className="h-6 w-6" />
      default:
        return <Zap className="h-6 w-6" />
    }
  }

  const getPlanFeatures = (features: any) => {
    const featureList = []
    
    if (features.vendas_comissao) {
      featureList.push(`${features.vendas_comissao}% de comissão nas vendas`)
    }
    
    if (features.relatorios) {
      featureList.push('Relatórios completos')
    }
    
    if (features.customizacao) {
      featureList.push('Customização da página de login')
    }
    
    if (features.senhas_hotspot) {
      featureList.push('Gerador de senhas hotspot')
    }
    
    if (features.relatorio_vendas) {
      featureList.push('Relatório de vendas')
    }
    
    if (features.relatorio_financeiro) {
      featureList.push('Relatório financeiro')
    }

    return featureList
  }

  if (showPayment && paymentData) {
    return (
      <Modal 
        open={isOpen} 
        onOpenChange={onClose} 
        className="max-w-lg w-full mx-4 backdrop-blur-xl"
        title="💳 Pagamento PIX"
      >
        <div className="relative overflow-hidden">
          {/* Background gradient animado */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-green-900/20 opacity-50"></div>
          
          <div className="relative z-10 text-center">
            {/* QR Code com frame melhorado */}
            <div className="mb-6 flex justify-center">
              <div className="relative p-4 bg-white rounded-2xl shadow-2xl border-4 border-gradient-to-r from-blue-500 to-purple-500">
                <img 
                  src={`data:image/png;base64,${paymentData.qr_code}`}
                  alt="QR Code PIX"
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxWidth: '200px' }}
                />
                {/* Pequeno ícone PIX */}
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <p className="text-blue-300 mb-2 font-medium">
                📱 Escaneie o QR Code no seu banco ou copie o código PIX
              </p>
            </div>
            
            {/* Código PIX com visual melhorado */}
            <div className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50 mb-6 hover:border-blue-500/50 transition-colors">
              <p className="text-sm text-gray-300 break-all font-mono leading-relaxed">
                {paymentData.pix_code}
              </p>
            </div>
            
            {/* Botão de copiar melhorado */}
            <Button
              onClick={() => copyToClipboard(paymentData.pix_code)}
              className="w-full mb-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl border-2 border-green-500/30 shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar Código PIX
              </div>
            </Button>
            
            {/* Informações do pagamento */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-400">
                  💰 Valor: R$ {paymentData.amount.toFixed(2)}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-3">
                <p className="text-sm font-semibold text-orange-400">
                  ⏰ Expira em: {new Date(paymentData.expires_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            
            {/* Aviso sobre aprovação automática */}
            <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                ✨ Seu plano será ativado automaticamente após a confirmação do pagamento
              </p>
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal 
      open={isOpen} 
      onOpenChange={onClose} 
      className="max-w-4xl w-full mx-4 backdrop-blur-md"
      title="Escolha seu Plano"
      description="Selecione o plano ideal para suas necessidades"
    >
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800/50 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-gray-400 mb-4 text-lg">Nenhum plano disponível no momento.</p>
          <p className="text-sm text-gray-500">Entre em contato com o suporte para mais informações.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header informativo */}
          <div className="text-center">
            <p className="text-gray-300 text-sm">
              Escolha o plano que melhor se adapta às suas necessidades
            </p>
          </div>
          
          {/* Grid de planos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan?.subscription_plans?.id === plan.id
              const isPro = plan.name === 'Pro'
              const isBasic = plan.name === 'Básico'
              const isFree = plan.price === 0
              const features = getPlanFeatures(plan.features)
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-gradient-to-br border rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:shadow-2xl hover:scale-[1.03] group overflow-hidden ${
                    isPro 
                      ? 'from-purple-900/30 via-purple-800/20 to-blue-900/30 border-purple-400/30 shadow-purple-500/20' 
                      : isBasic
                      ? 'from-blue-900/30 via-blue-800/20 to-cyan-900/30 border-blue-400/30 shadow-blue-500/20'
                      : isFree
                      ? 'from-green-900/30 via-green-800/20 to-emerald-900/30 border-green-400/30 shadow-green-500/20'
                      : 'from-gray-900/30 via-gray-800/20 to-gray-900/30 border-gray-700/30'
                  }`}
                >
                  {/* Elemento de brilho animado */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    isPro 
                      ? 'bg-gradient-to-r from-transparent via-purple-400/5 to-transparent' 
                      : isBasic
                      ? 'bg-gradient-to-r from-transparent via-blue-400/5 to-transparent'
                      : isFree
                      ? 'bg-gradient-to-r from-transparent via-green-400/5 to-transparent'
                      : 'bg-gradient-to-r from-transparent via-gray-400/5 to-transparent'
                  } animate-pulse`}></div>
                  
                  {/* Badge de Recomendação */}
                  {isPro && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <Badge className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 text-white border-0 px-4 py-2 shadow-2xl shadow-purple-500/50 animate-pulse">
                        <Star className="h-4 w-4 mr-1 animate-spin" style={{ animationDuration: '3s' }} />
                        <span className="font-bold">RECOMENDADO</span>
                      </Badge>
                    </div>
                  )}
                  
                  {isFree && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <Badge className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white border-0 px-4 py-2 shadow-2xl shadow-green-500/50">
                        <Zap className="h-4 w-4 mr-1" />
                        <span className="font-bold">GRÁTIS</span>
                      </Badge>
                    </div>
                  )}
                  
                  {isBasic && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <Badge className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 text-white border-0 px-4 py-2 shadow-2xl shadow-blue-500/50">
                        <span className="font-bold">POPULAR</span>
                      </Badge>
                    </div>
                  )}

                  {/* Header do Plano */}
                  <div className="flex items-center gap-4 mb-6 pt-4">
                    <div className={`relative p-4 rounded-2xl border-2 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                      isPro 
                        ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-400/40 text-purple-300 shadow-lg shadow-purple-500/25' 
                        : isBasic
                        ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/40 text-blue-300 shadow-lg shadow-blue-500/25'
                        : isFree
                        ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/40 text-green-300 shadow-lg shadow-green-500/25'
                        : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-400/40 text-gray-300'
                    }`}>
                      {getPlanIcon(plan.name)}
                      {/* Pequeno brilho no ícone */}
                      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 ${
                        isPro 
                          ? 'bg-gradient-to-br from-purple-400/10 to-blue-400/10' 
                          : isBasic
                          ? 'bg-gradient-to-br from-blue-400/10 to-cyan-400/10'
                          : isFree
                          ? 'bg-gradient-to-br from-green-400/10 to-emerald-400/10'
                          : 'bg-gradient-to-br from-gray-400/10 to-gray-500/10'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white truncate mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                        {plan.name}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-400 line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="mb-6 sm:mb-8 text-center relative">
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      {isFree ? (
                        <div className="relative">
                          <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse">
                            GRÁTIS
                          </span>
                          <div className="absolute inset-0 text-3xl sm:text-4xl font-extrabold text-green-400/20 blur-sm">
                            GRÁTIS
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <span className={`text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${
                            isPro 
                              ? 'from-purple-400 to-blue-400' 
                              : isBasic
                              ? 'from-blue-400 to-cyan-400'
                              : 'from-white to-gray-300'
                          }`}>
                            R$ {plan.price.toFixed(2)}
                          </span>
                          <div className={`absolute inset-0 text-3xl sm:text-4xl font-extrabold blur-sm opacity-30 ${
                            isPro 
                              ? 'text-purple-400' 
                              : isBasic
                              ? 'text-blue-400'
                              : 'text-white'
                          }`}>
                            R$ {plan.price.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!isFree && (
                      <div className="flex items-center justify-center gap-1 text-gray-400 text-sm">
                        <span>por</span>
                        <span className="font-semibold text-white">{plan.duration_days} dias</span>
                      </div>
                    )}
                    
                    {isFree && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 inline-block">
                        <p className="text-sm text-green-400 font-medium">
                          ✨ Teste por {plan.duration_days} dias
                        </p>
                      </div>
                    )}
                    
                    {isPro && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 inline-block mt-2">
                        <p className="text-sm text-purple-400 font-medium">
                          💎 Melhor Custo-Benefício
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-300">
                        Até {plan.max_mikrotiks} MikroTik{plan.max_mikrotiks > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-300 line-clamp-1">{feature}</span>
                      </div>
                    ))}
                    
                    {features.length > 3 && (
                      <div className="text-xs text-gray-400 text-center">
                        +{features.length - 3} recursos adicionais
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-300">
                        Conexão remota
                      </span>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan || processingPayment}
                    className={`relative w-full flex items-center justify-center gap-2 text-base font-bold py-4 px-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden group-hover:shadow-2xl transform group-hover:scale-105 ${
                      isCurrentPlan
                        ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                        : isPro
                        ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 hover:from-purple-700 hover:via-purple-600 hover:to-blue-700 border-purple-400 shadow-lg shadow-purple-500/25'
                        : isBasic
                        ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 border-blue-400 shadow-lg shadow-blue-500/25'
                        : isFree
                        ? 'bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-700 hover:via-green-600 hover:to-emerald-700 border-green-400 shadow-lg shadow-green-500/25'
                        : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border-gray-500'
                    }`}
                  >
                    {/* Efeito de brilho no botão */}
                    {!isCurrentPlan && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    )}
                    
                    {isCurrentPlan ? (
                      <>
                        <Check className="h-5 w-5" />
                        Plano Atual
                      </>
                    ) : processingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        {isFree ? (
                          <>
                            <Zap className="h-5 w-5" />
                            Ativar Grátis
                          </>
                        ) : (
                          <>
                            <Crown className="h-5 w-5" />
                            Escolher Plano
                          </>
                        )}
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
          
          {/* Footer informativo */}
          <div className="text-center pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              💡 Você pode cancelar ou alterar seu plano a qualquer momento
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
} 