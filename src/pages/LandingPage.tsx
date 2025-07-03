import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { BackgroundGradient } from '../components/ui/background-gradient'
import { Meteors } from '../components/ui/meteors'
import { 
  Wifi, 
  Shield, 
  BarChart3, 
  Settings, 
  Smartphone, 
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  Zap,
  MessageCircle,
  ArrowRight,
  Play,
  Sparkles,
  Router,
  Globe,
  DollarSign,
  Activity,
  Crown,
  User
} from 'lucide-react'

const LandingPage = () => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [typeSpeed, setTypeSpeed] = useState(100)
  const [vendasHoje, setVendasHoje] = useState(12840)
  const [senhasVendidas, setSenhasVendidas] = useState(3247)

  const textOptions = [
    {
      text: 'Controle Seu MikroTik De Qualquer Lugar',
      highlights: ['MikroTik', 'Qualquer Lugar']
    },
    {
      text: 'Venda Senhas do Seu Hotspot via PIX',
      highlights: ['Venda Senhas', 'PIX']
    },
    {
      text: 'Gere Senhas de Acesso de Qualquer Lugar',
      highlights: ['Gere Senhas', 'Qualquer Lugar']
    }
  ]

  useEffect(() => {
    const handleTyping = () => {
      const currentTextObj = textOptions[currentTextIndex]
      const currentText = currentTextObj.text
      
      if (!isDeleting) {
        // Digitando
        if (displayText.length < currentText.length) {
          setDisplayText(currentText.substring(0, displayText.length + 1))
          setTypeSpeed(100)
        } else {
          // Pausa no final
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        // Apagando
        if (displayText.length > 0) {
          setDisplayText(currentText.substring(0, displayText.length - 1))
          setTypeSpeed(50)
        } else {
          // Ir para próximo texto
          setIsDeleting(false)
          setCurrentTextIndex((prev) => (prev + 1) % textOptions.length)
        }
      }
    }

    const timer = setTimeout(handleTyping, typeSpeed)
    return () => clearTimeout(timer)
  }, [displayText, isDeleting, currentTextIndex, typeSpeed, textOptions])

  // Animação dos dados dinâmicos
  useEffect(() => {
    const interval = setInterval(() => {
      // Atualizar vendas hoje (varia de 3 a 5)
      setVendasHoje(prev => prev + Math.floor(Math.random() * 3) + 3)
      
      // Atualizar senhas vendidas (varia de 3 a 5)
      setSenhasVendidas(prev => prev + Math.floor(Math.random() * 3) + 3)
    }, 2000) // A cada 2 segundos

    return () => clearInterval(interval)
  }, [])

  const renderTextWithHighlights = () => {
    const currentTextObj = textOptions[currentTextIndex]
    let result = displayText
    
    // Aplicar highlights apenas nas palavras que já foram digitadas
    currentTextObj.highlights.forEach(highlight => {
      if (displayText.includes(highlight)) {
        result = result.replace(
          highlight,
          `<span class="text-blue-400">${highlight}</span>`
        )
      }
    })
    
    return result
  }

  const features = [
    {
      icon: Wifi,
      title: "Controle Total WiFi",
      description: "Controle seu MikroTik de qualquer lugar do mundo, sem necessidade de IP público",
      color: "blue"
    },
    {
      icon: DollarSign,
      title: "Vendas por PIX",
      description: "Sistema completo de vendas com PIX automático e controle de acesso",
      color: "green"
    },
    {
      icon: Users,
      title: "Senhas em Massa",
      description: "Gere milhares de senhas personalizadas com apenas alguns cliques",
      color: "purple"
    },
    {
      icon: Settings,
      title: "Página Personalizada",
      description: "Templates profissionais para sua página de login do hotspot",
      color: "orange"
    },
    {
      icon: BarChart3,
      title: "Relatórios Completos",
      description: "Estatísticas em tempo real e relatórios detalhados no painel",
      color: "cyan"
    },
    {
      icon: Shield,
      title: "Funciona Sempre",
      description: "Compatível com IP público, IP dedicado e conexões Starlink",
      color: "indigo"
    }
  ]

  const benefits = [
    "Até 3 MikroTiks por conta",
    "Controle remoto total",
    "Sem necessidade de IP público",
    "Compatible com Starlink",
    "Templates profissionais",
    "Relatórios em tempo real",
    "Suporte técnico incluído",
    "Atualizações automáticas"
  ]

  const stats = [
    { number: "1000+", label: "Clientes Ativos", icon: Users },
    { number: "99.9%", label: "Uptime", icon: Activity },
    { number: "24/7", label: "Suporte", icon: Clock },
    { number: "5★", label: "Avaliação", icon: Star }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-gray-800/50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                MikroPix
              </h1>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300 px-6 py-2 rounded-xl border border-transparent hover:border-blue-500/30"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                </motion.div>
              </Link>
              <Link to="/register">
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }} 
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 border border-blue-400/30">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Testar Grátis
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >

            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight h-[180px] md:h-[240px] flex items-center justify-center"
            >
              <span 
                className="text-white text-center"
                dangerouslySetInnerHTML={{ 
                  __html: renderTextWithHighlights() + '<span class="animate-pulse text-blue-400">|</span>' 
                }}
              />
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-300 mb-8 leading-relaxed"
            >
              Sistema completo para gerenciar seus equipamentos MikroTik remotamente.
              <br />
              <span className="text-blue-400 font-semibold">Venda acesso WiFi, gere senhas personalizadas e monitore tudo em tempo real.</span>
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Testar Por 7 Dias
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-green-500 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-white hover:bg-green-500/20 px-8 py-3 text-lg rounded-xl backdrop-blur-sm transition-all duration-300"
                >
                  <MessageCircle className="w-5 h-5 mr-2 text-green-400" />
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-semibold">
                    Falar no WhatsApp
                  </span>
                </Button>
              </a>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div 
              variants={itemVariants}
              className="mb-12"
            >
              <div className="max-w-4xl mx-auto">
                {/* Simple Dashboard Mockup */}
                <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Header */}
                  <div className="bg-gray-800/90 border-b border-gray-700/50 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                          <path d="M12 20h.01"></path>
                          <path d="M2 8.82a15 15 0 0 1 20 0"></path>
                          <path d="M5 12.859a10 10 0 0 1 14 0"></path>
                          <path d="M8.5 16.429a5 5 0 0 1 7 0"></path>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">MikroPix Dashboard</h3>
                        <p className="text-gray-400 text-sm">mikropix.online</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Senhas Vendidas */}
                      <motion.div 
                        className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-xl p-4"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="flex items-center space-x-3">
                          <Users className="w-6 h-6 text-blue-400" />
                          <div>
                            <motion.div 
                              key={senhasVendidas}
                              initial={{ scale: 1.1, color: "#60a5fa" }}
                              animate={{ scale: 1, color: "#ffffff" }}
                              transition={{ duration: 0.3 }}
                              className="text-2xl font-bold text-white"
                            >
                              {senhasVendidas.toLocaleString()}
                            </motion.div>
                            <div className="text-sm text-gray-400">Senhas Vendidas</div>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* Vendas Hoje */}
                      <motion.div 
                        className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 rounded-xl p-4"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      >
                        <div className="flex items-center space-x-3">
                          <DollarSign className="w-6 h-6 text-green-400" />
                          <div>
                            <motion.div 
                              key={vendasHoje}
                              initial={{ scale: 1.1, color: "#4ade80" }}
                              animate={{ scale: 1, color: "#ffffff" }}
                              transition={{ duration: 0.3 }}
                              className="text-2xl font-bold text-white"
                            >
                              R$ {vendasHoje.toLocaleString()}
                            </motion.div>
                            <div className="text-sm text-gray-400">Vendas Hoje</div>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* MikroTiks */}
                      <motion.div 
                        className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 rounded-xl p-4"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                      >
                        <div className="flex items-center space-x-3">
                          <Router className="w-6 h-6 text-purple-400" />
                          <div>
                            <div className="text-2xl font-bold text-white">3</div>
                            <div className="text-sm text-gray-400">MikroTiks Ativos</div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Chart Section */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <h4 className="text-white font-semibold">Vendas dos Últimos 7 Dias</h4>
                        <div className="flex items-center space-x-2 text-gray-400">
                          <BarChart3 className="w-4 h-4" />
                          <span className="text-sm">Em tempo real</span>
                        </div>
                      </div>
                      <div className="flex items-end space-x-2 h-20">
                        {[40, 65, 30, 80, 55, 90, 70].map((height, i) => (
                          <motion.div 
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t flex-1 min-h-[8px]"
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => (
                          <span key={i}>{day}</span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 text-center hover:bg-gray-700/30 transition-colors cursor-pointer">
                        <Settings className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                        <span className="text-white text-sm">Configurar</span>
                      </div>
                      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 text-center hover:bg-gray-700/30 transition-colors cursor-pointer">
                        <Users className="w-5 h-5 text-green-400 mx-auto mb-2" />
                        <span className="text-white text-sm">Usuários</span>
                      </div>
                      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 text-center hover:bg-gray-700/30 transition-colors cursor-pointer">
                        <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                        <span className="text-white text-sm">Relatórios</span>
                      </div>
                      <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 text-center hover:bg-gray-700/30 transition-colors cursor-pointer">
                        <Shield className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                        <span className="text-white text-sm">Segurança</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-8">
                  <p className="text-lg text-gray-300 mb-2">
                    Veja como é simples gerenciar seus MikroTiks
                  </p>
                  <p className="text-blue-400 font-semibold">
                    Interface completa e intuitiva
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <BackgroundGradient className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4">
                    <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white mb-1">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </BackgroundGradient>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Easy Installation Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900/30 to-black/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Instalação Super Fácil
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Apenas <span className="text-blue-400 font-bold">3 passos simples</span> e seu MikroTik já está na nuvem!
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <BackgroundGradient className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-6 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-400">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Crie sua conta</h3>
                  <p className="text-gray-400">7 dias grátis para testar tudo</p>
                </BackgroundGradient>
              </motion.div>

              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <BackgroundGradient className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-400">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Adicione seu MikroTik</h3>
                  <p className="text-gray-400">Cadastre suas informações de acesso</p>
                </BackgroundGradient>
              </motion.div>

              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <BackgroundGradient className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20 rounded-2xl p-6 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Copie e cole</h3>
                  <p className="text-gray-400">No terminal do Winbox e pronto!</p>
                </BackgroundGradient>
              </motion.div>
            </div>

            <motion.div
              className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-8"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
                <span className="text-xl font-semibold text-white">100% Seguro e Automático</span>
              </div>
              <p className="text-gray-400 text-lg">
                Sem configurações complexas, sem necessidade de IP público.
                <br />
                <span className="text-blue-400 font-semibold">Funciona até mesmo com internet Starlink!</span>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Tudo Que Você Precisa
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Ferramentas profissionais para gestão completa da sua rede MikroTik
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative overflow-hidden"
              >
                <BackgroundGradient 
                  className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 group-hover:border-blue-500/50 transition-all duration-300 relative"
                  containerClassName="h-full"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <Meteors number={5} />
                  </div>
                  
                  <div className={`w-12 h-12 bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-600/10 border border-${feature.color}-500/20 rounded-xl flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-blue-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                </BackgroundGradient>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Plano Simples e Transparente
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Um único plano com tudo incluído. Sem pegadinhas, sem taxas escondidas.
            </p>
          </motion.div>

          <motion.div 
            className="max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="relative group">
              {/* Outer glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-all duration-700"></div>
              
              {/* Popular badge - fora do card */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-30">
                <motion.div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl border-2 border-white/20"
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="flex items-center space-x-2">
                    <Crown className="w-4 h-4" />
                    <span>MAIS POPULAR</span>
                  </span>
                </motion.div>
              </div>

              {/* Main card */}
              <motion.div 
                className="relative bg-black border-2 border-blue-500/50 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/25"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.4)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                
                {/* Content */}
                <div className="relative z-10 p-8 pt-12">
                  
                  {/* Header */}
                  <div className="text-center mb-8">
                    {/* Logo */}
                    <div className="w-20 h-20 mx-auto mb-6 p-3 rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border-2 border-blue-500/40 shadow-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-blue-300">
                        <path d="M12 20h.01"></path>
                        <path d="M2 8.82a15 15 0 0 1 20 0"></path>
                        <path d="M5 12.859a10 10 0 0 1 14 0"></path>
                        <path d="M8.5 16.429a5 5 0 0 1 7 0"></path>
                      </svg>
                    </div>
                    
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">Plano Pro</h3>
                    
                    {/* Price section */}
                    <div className="mb-6">
                      {/* Estratégia de marketing - preço original riscado */}
                      <div className="text-center mb-4">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="inline-block"
                        >
                          <span className="text-xl text-gray-500 line-through mr-3">
                            De R$ 59,90
                          </span>
                          <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            -42%
                          </span>
                        </motion.div>
                      </div>
                      
                      <motion.div 
                        className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-300 bg-clip-text text-transparent mb-2"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        Por apenas R$ 34,90
                        <span className="text-xl text-gray-300">/mês</span>
                      </motion.div>
                      
                      {/* Free trial highlight */}
                      <motion.div 
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/30 to-emerald-500/20 border-2 border-green-500/50 rounded-full px-6 py-3 mb-4 shadow-lg shadow-green-500/20"
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Star className="w-5 h-5 text-green-300" />
                        <span className="text-green-300 font-bold">7 dias totalmente grátis</span>
                      </motion.div>
                      
                      <p className="text-gray-400 font-medium">
                        <span className="text-red-400 font-bold">⚡ Oferta por tempo limitado!</span>
                        <br />
                        Sem cartão • Cancele quando quiser
                      </p>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-4 mb-10">
                    {benefits.map((benefit, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-900/20 hover:to-cyan-900/20 transition-all duration-300 group border border-gray-800/50 hover:border-blue-500/30"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.02, x: 5 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 group-hover:text-green-400 transition-colors duration-300" />
                        </motion.div>
                        <span className="text-gray-200 group-hover:text-white transition-colors duration-300 font-medium text-lg">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link to="/register" className="block mb-6">
                    <motion.div
                      whileHover={{ 
                        scale: 1.03,
                        boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)"
                      }}
                      whileTap={{ scale: 0.97 }}
                      className="group relative"
                    >
                      <Button 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 hover:from-green-500 hover:via-emerald-400 hover:to-green-500 text-white py-6 text-xl font-bold rounded-xl shadow-2xl transition-all duration-500 relative overflow-hidden border-2 border-green-400/50"
                      >
                        <motion.div
                          animate={{ 
                            background: [
                              "linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)",
                              "linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                        />
                        <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                        🚀 Testar Por 7 Dias
                        <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
                      </Button>
                    </motion.div>
                  </Link>
                  
                  {/* Security badges */}
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span className="font-medium">Seguro</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium">Instantâneo</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">Garantido</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/10 to-cyan-900/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Comece Agora Mesmo
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              <span className="text-blue-400 font-bold">7 dias totalmente grátis</span> para testar todas as funcionalidades.
              <br />
              Sem cartão de crédito, sem compromisso.
            </p>
            
            <Link to="/register">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-10 py-4 text-xl font-bold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                <Star className="w-6 h-6 mr-3" />
                Testar Por 7 Dias
                <Play className="w-6 h-6 ml-3" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-800/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                MikroPix
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
                Cadastro
              </Link>
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                Suporte
              </a>
            </div>
          </div>
          
          <div className="text-center text-gray-500 mt-8 pt-8 border-t border-gray-800/50">
            <p>&copy; 2024 MikroPix. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5, type: "spring" }}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
      >
        <a
          href="https://wa.me/5511999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-full shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      </motion.div>
    </div>
  )
}

export default LandingPage