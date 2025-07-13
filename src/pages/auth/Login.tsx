import React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { useSystemSettings } from '../../contexts/SystemSettingsContext'
import { SystemLogo } from '../../components/ui/SystemLogo'
import { Button, Input, InlineLoader } from '../../components/ui'
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight, Wifi, Star } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

// Função para remover props do Framer Motion antes de renderizar no DOM
function stripMotionProps(props: any) {
  const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
  return rest;
}

// Atualização: removemos completamente Framer-Motion neste projeto, mas mantemos
// estes wrappers para evitar refatoração pesada. Eles descartam props de animação
// e rendereizam elementos HTML nativos.
const motion = {
  div: (props: any) => <div {...stripMotionProps(props)} />,
  h1: (props: any) => <h1 {...stripMotionProps(props)} />,
  h3: (props: any) => <h3 {...stripMotionProps(props)} />,
  p: (props: any) => <p {...stripMotionProps(props)} />,
  button: (props: any) => <button {...stripMotionProps(props)} />,
  form: (props: any) => <form {...stripMotionProps(props)} />,
}

// Mapeia mensagens de erro do Supabase para PT-BR amigável
function traduzErroSupabase(msg: string): string {
  const mapa: Record<string, string> = {
    'Invalid login credentials': 'Credenciais inválidas. Verifique seu email e senha.',
    'User not confirmed': 'Conta ainda não confirmada. Verifique seu email.',
  };
  return mapa[msg] || msg;
}

export function Login() {
  const { signIn, user } = useAuthContext()
  const { settings } = useSystemSettings()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (user) {
    return <Navigate to="/app/dashboard" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true)
      setError('')
      
      const { error } = await signIn(data.email, data.password)
      if (error) {
        setError(traduzErroSupabase(error.message))
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header fixo no topo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800/50 p-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
            <SystemLogo size="lg" />
            <h1 className="text-xl font-bold text-white">{settings.site_name}</h1>
          </div>
        </div>
      </header>

      <div className="pt-20 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side - Welcome Back */}
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
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
                Bem-vindo de volta
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Entre na sua conta para acessar o painel
              </p>
            </motion.div>

            {/* Pro Plan Promotion */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20"
            >
              <div className="flex items-start gap-4 mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30"
                >
                  <Star className="w-8 h-8 text-blue-400" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Ainda não tem conta?</h3>
                  <p className="text-blue-300 font-semibold mb-2">
                    ✨ Teste o Plano Pro GRÁTIS por 7 dias
                  </p>
                  <p className="text-gray-400 text-sm">
                    Acesso completo • Sem cartão • Cancele quando quiser
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg border border-green-500/30"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Star className="w-5 h-5" />
                      <span>Começar teste grátis</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Security badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="flex items-center gap-6 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Login seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Dados protegidos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Suporte 24/7</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
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
                <h3 className="text-2xl font-bold text-white mb-2">Fazer login</h3>
                <p className="text-gray-400">Digite suas credenciais para entrar</p>
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

                {/* Email */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-400" />
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Digite seu email"
                    className="bg-black/40 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 pl-4 transition-all duration-300"
                    {...register('email')}
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

                {/* Password */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-400" />
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      className="bg-black/40 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 pl-4 pr-12 transition-all duration-300"
                      {...register('password')}
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
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="pt-4"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="w-full flex items-center justify-center space-x-2">
                          <InlineLoader size="sm" />
                          <span>Entrando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <LogIn className="h-5 w-5" />
                          <span>Entrar na minha conta</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
    </div>
  )
}