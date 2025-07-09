import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types'
import type { Session } from '@supabase/supabase-js'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Atualizar sessão sempre que mudar
      setSession(session)

      // Evitar refetch desnecessário de perfil quando apenas o token foi renovado
      if (event !== 'TOKEN_REFRESHED' && session?.user) {
        fetchUserProfile(session.user.id)
      } else if (!session?.user) {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, nome: string, cpf: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          cpf,
        },
      },
    })

    // Se o usuário foi criado com sucesso, atualizar a tabela users com o CPF
    if (data.user && !error) {
      try {
        await supabase
          .from('users')
          .update({ cpf })
          .eq('id', data.user.id)

        // 🎯 ATIVAR PLANO TESTE GRÁTIS AUTOMATICAMENTE
        console.log('🎁 Ativando plano teste grátis para novo usuário:', data.user.id)
        
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auto-trial/process-new-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: data.user.id,
              email: email
            })
          })

          const trialResult = await response.json()
          
          if (trialResult.success) {
            console.log('✅ Plano teste grátis ativado com sucesso!', trialResult)
          } else {
            console.warn('⚠️ Não foi possível ativar o plano teste:', trialResult.reason || trialResult.error)
          }
        } catch (trialError) {
          console.error('❌ Erro ao ativar plano teste grátis:', trialError)
          // Não retorna erro para não afetar o registro
        }

      } catch (updateError) {
        console.error('Error updating user with CPF:', updateError)
      }
    }

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      setUser(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const updateUser = async () => {
    if (!session?.user) return { error: new Error('No user logged in') }
    
    try {
      await fetchUserProfile(session.user.id)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateUser,
  }
}