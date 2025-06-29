import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Router, Save, ArrowLeft, Wifi, Percent, Key, User, Globe, Lock, Settings } from 'lucide-react'

const mikrotikSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  porcentagem: z.number().min(0).max(100, 'Porcentagem deve estar entre 0 e 100'),
  ip: z.string().ip('IP deve ser válido'),
  username: z.string().min(1, 'Username é obrigatório'),
  password: z.string().min(1, 'Password é obrigatório'),
  port: z.number().min(1).max(65535).optional(),
  token: z.string().optional(),
  user_id: z.string().optional(),
})

type MikrotikForm = z.infer<typeof mikrotikSchema>

export function MikrotikFormPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MikrotikForm>({
    resolver: zodResolver(mikrotikSchema),
    defaultValues: {
      porcentagem: 10,
      port: 8728,
    }
  })

  const selectedUserId = watch('user_id')

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
    }
    
    if (isEdit) {
      fetchMikrotik()
    }
  }, [id, user])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nome, email')
        .order('nome')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchMikrotik = async () => {
    if (!id) return

    try {
      setInitialLoading(true)
      const { data, error } = await supabase
        .from('mikrotiks')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setValue('nome', data.nome)
        setValue('porcentagem', data.porcentagem)
        setValue('ip', data.ip || '')
        setValue('username', data.username || '')
        setValue('password', data.password || '')
        setValue('port', data.port || 8728)
        setValue('token', data.token || '')
        if (user?.role === 'admin') {
          setValue('user_id', data.user_id)
        }
      }
    } catch (error) {
      console.error('Error fetching mikrotik:', error)
      setError('Erro ao carregar dados do MikroTik')
    } finally {
      setInitialLoading(false)
    }
  }

  const onSubmit = async (data: MikrotikForm) => {
    try {
      setLoading(true)
      setError('')

      const mikrotikData = {
        nome: data.nome,
        porcentagem: data.porcentagem,
        ip: data.ip,
        username: data.username,
        password: data.password,
        port: data.port || 8728,
        token: data.token || null,
        user_id: user?.role === 'admin' ? data.user_id : user?.id,
        ativo: true,
      }

      let mikrotikId: string

      if (isEdit) {
        const { error } = await supabase
          .from('mikrotiks')
          .update(mikrotikData)
          .eq('id', id)

        if (error) throw error
        mikrotikId = id!
      } else {
        const { data: newMikrotik, error } = await supabase
          .from('mikrotiks')
          .insert([mikrotikData])
          .select('id')
          .single()

        if (error) throw error
        mikrotikId = newMikrotik.id

      }

      navigate('/mikrotiks')
    } catch (error: any) {
      console.error('Error saving mikrotik:', error)
      setError(error.message || 'Erro ao salvar MikroTik')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-800 rounded-lg w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded w-96 animate-pulse"></div>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-8 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-800 rounded w-24 animate-pulse"></div>
                <div className="h-12 bg-gray-800 rounded-lg animate-pulse"></div>
              </div>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/mikrotiks')}
                className="p-2 sm:p-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              
              <div className="p-2 sm:p-3 rounded-xl bg-gray-800 border border-gray-700">
                <Router className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              </div>
              
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-white">
                  {isEdit ? 'Editar MikroTik' : 'Novo MikroTik'}
                </h1>
                <p className="text-gray-400 text-sm sm:text-base">
                  {isEdit ? 'Atualize as informações do seu MikroTik' : 'Configure um novo roteador MikroTik'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-black border border-gray-800 rounded-2xl p-4 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
              {error && (
                <div className="p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:gap-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nome do MikroTik
                  </label>
                  <div className="relative">
                    <Wifi className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Ex: MikroTik Principal"
                      className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register('nome')}
                    />
                  </div>
                  {errors.nome && (
                    <p className="mt-1 text-sm text-red-400">{errors.nome.message}</p>
                  )}
                </div>

                {/* Porcentagem */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Porcentagem de Comissão (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="10.00"
                      className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register('porcentagem', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.porcentagem && (
                    <p className="mt-1 text-sm text-red-400">{errors.porcentagem.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Percentual que será pago como comissão sobre cada venda
                  </p>
                </div>

                {/* IP Address */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Endereço IP
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="192.168.1.1"
                      className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register('ip')}
                    />
                  </div>
                  {errors.ip && (
                    <p className="mt-1 text-sm text-red-400">{errors.ip.message}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Usuário
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="admin"
                      className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register('username')}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                  )}
                </div>

                {/* Port */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Porta API (Opcional)
                  </label>
                  <div className="relative">
                    <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      max="65535"
                      placeholder="8728"
                      className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register('port', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.port && (
                    <p className="mt-1 text-sm text-red-400">{errors.port.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Porta padrão da API MikroTik (8728)
                  </p>
                </div>

                {/* Token */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Token de Acesso (Opcional)
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Token para comunicação com a API"
                      className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register('token')}
                    />
                  </div>
                  {errors.token && (
                    <p className="mt-1 text-sm text-red-400">{errors.token.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Token utilizado para autenticação na API do MikroTik
                  </p>
                </div>

                {/* User Selection - Only for admin */}
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Usuário Responsável
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 text-white rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none"
                        {...register('user_id')}
                      >
                        <option value="">Selecione um usuário</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.user_id && (
                      <p className="mt-1 text-sm text-red-400">{errors.user_id.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Preview Card */}
              <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
                <h3 className="text-lg font-medium text-white mb-4">Prévia do MikroTik</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nome:</span>
                    <span className="text-white">{watch('nome') || 'Nome do MikroTik'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Comissão:</span>
                    <span className="text-green-400 font-medium">{watch('porcentagem') || 0}%</span>
                  </div>
                  {watch('token') && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Token:</span>
                      <span className="text-blue-400 font-mono text-sm">Configurado</span>
                    </div>
                  )}
                  {user?.role === 'admin' && selectedUserId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Usuário:</span>
                      <span className="text-white">
                        {users.find(u => u.id === selectedUserId)?.nome || 'Usuário selecionado'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/mikrotiks')}
                  className="flex-1 border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 hover:bg-gray-900 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>{isEdit ? 'Atualizar' : 'Criar'} MikroTik</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}