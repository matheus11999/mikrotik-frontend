import React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { Button, Input, InlineLoader } from '../../components/ui'
import { Eye, EyeOff, Mail, Lock, User, UserPlus, ArrowLeft, Wifi, CheckCircle, CreditCard, Star, Crown, ArrowRight } from 'lucide-react'

// Função para validar CPF
function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '')
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let digit1 = 11 - (sum % 11)
  if (digit1 > 9) digit1 = 0
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  let digit2 = 11 - (sum % 11)
  if (digit2 > 9) digit2 = 0
  
  // Verifica se os dígitos calculados conferem com os informados
  return parseInt(cpf.charAt(9)) === digit1 && parseInt(cpf.charAt(10)) === digit2
}

// Função para formatar CPF
function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '')
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .refine((cpf) => isValidCPF(cpf), 'CPF inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type RegisterForm = z.infer<typeof registerSchema>

// Remove props de animação antes de renderizar no DOM
function stripMotionProps(props: any) {
  const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
  return rest;
}

// Stub motion sem Framer Motion
const motion = {
  div: (props: any) => <div {...stripMotionProps(props)} />,
  h1: (props: any) => <h1 {...stripMotionProps(props)} />,
  h3: (props: any) => <h3 {...stripMotionProps(props)} />,
  p: (props: any) => <p {...stripMotionProps(props)} />,
  button: (props: any) => <button {...stripMotionProps(props)} />,
  form: (props: any) => <form {...stripMotionProps(props)} />,
}

function traduzErroSupabase(msg: string): string {
  const mapa: Record<string, string> = {
    'User already registered': 'Usuário já registrado. Faça login ou recupere a senha.',
    'Invalid password': 'Senha inválida.',
  };
  return mapa[msg] || msg;
}

export function Register() {
  const { signUp, user } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [cpfValue, setCpfValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  if (user) {
    return <Navigate to="/app/dashboard" replace />
  }

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true)
      setError('')
      
      // Remove formatação do CPF antes de enviar
      const cleanCpf = data.cpf.replace(/[^\d]/g, '')
      
      const { error } = await signUp(data.email, data.password, data.nome, cleanCpf)
      if (error) {
        setError(traduzErroSupabase(error.message))
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setCpfValue(formatted)
    setValue('cpf', e.target.value.replace(/[^\d]/g, ''))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
          className="w-full max-w-md"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 shadow-2xl text-center"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 backdrop-blur-sm flex items-center justify-center"
            >
              <CheckCircle className="h-10 w-10 text-green-400" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4"
            >
              🎉 Conta criada com sucesso!
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mb-6"
            >
              <div className="bg-green-500/20 border-2 border-green-500/30 rounded-xl p-4 mb-4">
                <p className="text-green-400 font-bold text-lg mb-2">
                  ✅ Seu PLANO PRO está ativo por 7 dias!
                </p>
                <p className="text-green-300 text-sm">
                  Todos os recursos premium já estão disponíveis na sua conta
                </p>
              </div>
              <p className="text-gray-400 text-base">
                Verifique seu email para confirmar sua conta e fazer login.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/login">
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-green-500/30">
                  <Crown className="w-5 h-5 mr-2" />
                  Acessar meu Plano Pro
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="order-2 lg:order-1"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 backdrop-blur-sm flex items-center justify-center">
                  <Wifi className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">MikroPix</h1>
                  <p className="text-gray-400 text-sm">Sistema de gestão MikroTik</p>
                </div>
              </div>
              
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
                Comece seu teste grátis
              </h2>
              <p className="text-xl text-gray-400">
                7 dias de acesso completo ao <span className="text-blue-400 font-semibold">Plano Pro</span>
              </p>
            </motion.div>

            {/* Pro Plan Highlight */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative mb-8 p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-2 border-green-500/30 shadow-2xl shadow-green-500/20"
            >
              {/* Floating badge */}
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg"
              >
                GRÁTIS POR 7 DIAS
              </motion.div>

              <div className="flex items-start gap-4 mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center border border-green-500/30"
                >
                  <Crown className="w-8 h-8 text-green-400" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Plano Pro</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-green-400">R$ 34,90</span>
                    <span className="text-gray-400">/mês</span>
                    <span className="text-sm bg-red-500 text-white px-2 py-1 rounded font-bold">-42%</span>
                  </div>
                  <p className="text-green-300 font-semibold">
                    ✨ Teste completo sem compromisso
                  </p>
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "✓", text: "Até 3 MikroTiks" },
                  { icon: "✓", text: "Templates profissionais" },
                  { icon: "✓", text: "Vendas automáticas PIX" },
                  { icon: "✓", text: "Relatórios completos" },
                  { icon: "✓", text: "Suporte prioritário" },
                  { icon: "✓", text: "Sem IP público necessário" }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-green-400 font-bold">{benefit.icon}</span>
                    <span className="text-gray-300 text-sm">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Security badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="flex items-center gap-6 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Sem cartão</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Suporte 24/7</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="order-1 lg:order-2"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 lg:p-8 shadow-2xl"
            >
              {/* Form Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-center mb-8"
              >
                <h3 className="text-2xl font-bold text-white mb-2">Criar sua conta</h3>
                <p className="text-gray-400">Preencha os dados abaixo para começar</p>
              </motion.div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-400" />
                Nome completo
              </label>
              <div className="relative">
                <Input
                  {...register('nome')}
                  type="text"
                  placeholder="Digite seu nome completo"
                  className="bg-black/40 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 pl-4 transition-all duration-300"
                />
              </div>
              {errors.nome && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm flex items-center gap-1"
                >
                  <span>⚠️</span> {errors.nome.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="Digite seu email"
                className="bg-black/40 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 pl-4 transition-all duration-300"
              />
              {errors.email && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm flex items-center gap-1"
                >
                  <span>⚠️</span> {errors.email.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-400" />
                CPF
              </label>
              <Input
                value={cpfValue}
                onChange={handleCpfChange}
                type="text"
                placeholder="000.000.000-00"
                maxLength={14}
                className="bg-black/40 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 pl-4 transition-all duration-300"
              />
              {errors.cpf && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm flex items-center gap-1"
                >
                  <span>⚠️</span> {errors.cpf.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-400" />
                Senha
              </label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  className="bg-black/40 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 pl-4 pr-12 transition-all duration-300"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </div>
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm flex items-center gap-1"
                >
                  <span>⚠️</span> {errors.password.message}
                </motion.p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="pt-4"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border-2 border-green-500/30 relative overflow-hidden"
                >
                  {loading ? (
                    <div className="w-full flex items-center justify-center space-x-2">
                      <InlineLoader size="sm" />
                      <span>Criando conta...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Star className="h-5 w-5" />
                      <span>Começar teste grátis de 7 dias</span>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </motion.div>
            </motion.div>

            {/* Login Link */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="text-center pt-6 border-t border-gray-800/50 mt-8"
            >
              <span className="text-gray-400">Já tem uma conta? </span>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link 
                  to="/login" 
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors inline-flex items-center space-x-1"
                >
                  <span>Fazer login</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </motion.div>
          </form>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}