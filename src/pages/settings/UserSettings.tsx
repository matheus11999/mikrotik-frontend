import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Save, 
  Upload, 
  Eye, 
  EyeOff,
  Key,
  Phone,
  CreditCard,
  Camera,
  Mail,
  Lock,
  UserCircle
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useToast } from '../../components/ui/toast'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface UserProfile {
  id: string
  nome: string
  email: string
  whatsapp?: string
  chave_pix?: string
  avatar_url?: string
  role: string
  saldo?: number
}

export function UserSettings() {
  const { user, updateUser } = useAuthContext()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '',
    nome: user?.nome || '',
    email: user?.email || '',
    whatsapp: '',
    chave_pix: '',
    avatar_url: '',
    role: user?.role || 'user',
    saldo: 0
  })

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      if (data) {
        setProfile({
          id: data.id,
          nome: data.nome,
          email: data.email,
          whatsapp: data.whatsapp || '',
          chave_pix: data.chave_pix || '',
          avatar_url: data.avatar_url || '',
          role: data.role,
          saldo: data.saldo || 0
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Erro ao carregar perfil do usuário'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('users')
        .update({
          nome: profile.nome,
          whatsapp: profile.whatsapp,
          chave_pix: profile.chave_pix,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      // Atualizar contexto de autenticação
      await updateUser()

      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'Perfil atualizado com sucesso'
      })

    } catch (error) {
      console.error('Error updating profile:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Erro ao atualizar perfil'
      })
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Nova senha e confirmação não coincidem'
      })
      return
    }

    if (passwords.new.length < 6) {
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Nova senha deve ter pelo menos 6 caracteres'
      })
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      })

      if (error) throw error

      setPasswords({ current: '', new: '', confirm: '' })

      addToast({
        type: 'success',
        title: 'Sucesso!',
        description: 'Senha alterada com sucesso'
      })

    } catch (error) {
      console.error('Error updating password:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Erro ao alterar senha'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath)

      setProfile(prev => ({
        ...prev,
        avatar_url: data.publicUrl
      }))

      addToast({
        type: 'success',
        title: 'Upload realizado!',
        description: 'Foto de perfil enviada com sucesso'
      })

    } catch (error) {
      console.error('Error uploading avatar:', error)
      addToast({
        type: 'error',
        title: 'Erro no upload',
        description: 'Erro ao enviar foto de perfil'
      })
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Meu Perfil
          </h1>
          <p className="text-gray-400 mt-2">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Informações Pessoais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <UserCircle className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Informações Pessoais</h2>
          </div>

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-700"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center border-2 border-gray-700">
                    <span className="text-white font-bold text-xl">
                      {getInitials(profile.nome)}
                    </span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handleAvatarUpload(file)
                    }
                    input.click()
                  }}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h3 className="font-semibold text-white">{profile.nome}</h3>
                <p className="text-sm text-gray-400 capitalize">{profile.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
                <p className="text-sm text-green-400 font-medium">
                  Saldo: {formatCurrency(profile.saldo || 0)}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={profile.nome}
                onChange={(e) => setProfile(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Seu nome completo"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="mt-1 opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                O email não pode ser alterado
              </p>
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="whatsapp"
                  value={profile.whatsapp}
                  onChange={(e) => setProfile(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="chave_pix">Chave PIX</Label>
              <div className="relative mt-1">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="chave_pix"
                  value={profile.chave_pix}
                  onChange={(e) => setProfile(prev => ({ ...prev, chave_pix: e.target.value }))}
                  placeholder="email@exemplo.com ou CPF ou telefone"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Para recebimento de pagamentos
              </p>
            </div>

            <Button
              onClick={updateProfile}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Informações'}
            </Button>
          </div>
        </motion.div>

        {/* Segurança */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Lock className="h-5 w-5 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Segurança</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="current_password">Senha Atual</Label>
              <div className="relative mt-1">
                <Input
                  id="current_password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  placeholder="Digite sua senha atual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="new_password">Nova Senha</Label>
              <div className="relative mt-1">
                <Input
                  id="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Digite sua nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Confirme sua nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={updatePassword}
                disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Key className="h-4 w-4 mr-2" />
                {saving ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Informações da Conta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-green-500/20">
            <User className="h-5 w-5 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Informações da Conta</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-1">ID do Usuário</h3>
            <p className="text-white font-mono text-sm">{profile.id}</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Tipo de Conta</h3>
            <p className="text-white capitalize">
              {profile.role === 'admin' ? 'Administrador' : 'Usuário'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Saldo Atual</h3>
            <p className="text-green-400 font-semibold">
              {formatCurrency(profile.saldo || 0)}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}