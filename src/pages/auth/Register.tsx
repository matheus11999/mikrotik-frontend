import React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { Button, Input, InlineLoader } from '../../components/ui'
import { Eye, EyeOff, Mail, Lock, User, UserPlus, ArrowLeft, Wifi, CheckCircle, CreditCard } from 'lucide-react'

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
              Conta criada com sucesso!
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-gray-400 mb-8 text-lg"
            >
              Verifique seu email para confirmar sua conta e fazer login.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  Ir para Login
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 backdrop-blur-sm flex items-center justify-center shadow-2xl"
          >
            <Wifi className="h-8 w-8 text-blue-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3"
          >
            Criar conta
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-gray-400 text-lg"
          >
            Preencha os dados para começar
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-4 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20"
          >
            <p className="text-green-400 text-sm font-medium flex items-center gap-2">
              🎁 <span>Ganhe 7 dias grátis ao se registrar!</span>
            </p>
            <p className="text-green-300/70 text-xs mt-1">
              Seu plano teste será ativado automaticamente após o registro
            </p>
          </motion.div>
        </motion.div>

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 shadow-2xl"
        >
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome completo
              </label>
              <Input
                {...register('nome')}
                type="text"
                placeholder="Digite seu nome completo"
                className="bg-gray-900/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
              />
              {errors.nome && (
                <p className="text-red-400 text-sm">{errors.nome.message}</p>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="Digite seu email"
                className="bg-gray-900/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
              />
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email.message}</p>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                CPF
              </label>
              <Input
                value={cpfValue}
                onChange={handleCpfChange}
                type="text"
                placeholder="000.000.000-00"
                maxLength={14}
                className="bg-gray-900/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
              />
              {errors.cpf && (
                <p className="text-red-400 text-sm">{errors.cpf.message}</p>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  className="bg-gray-900/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm">{errors.password.message}</p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="w-full flex items-center justify-center space-x-2">
                    <InlineLoader size="sm" />
                    <span>Criando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>Criar conta</span>
                  </div>
                )}
              </Button>
            </motion.div>

            {/* Divider */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="relative my-8"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-black/40 backdrop-blur-sm text-gray-400">ou</span>
              </div>
            </motion.div>

            {/* Login Link */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="text-center"
            >
              <span className="text-gray-400">Já tem uma conta? </span>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link 
                  to="/login" 
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors inline-flex items-center space-x-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Fazer login</span>
                </Link>
              </motion.div>
            </motion.div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-gray-500 text-sm">
            © 2024 MikroPix. Sistema de gestão MikroTik.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}