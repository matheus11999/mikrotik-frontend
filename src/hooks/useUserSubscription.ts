import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../contexts/AuthContext'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  duration_days: number
}

interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  starts_at: string
  expires_at: string
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
  subscription_plans: SubscriptionPlan
}

export interface SubscriptionStatus {
  hasActivePlan: boolean
  isTrialUser: boolean
  subscription: UserSubscription | null
  daysRemaining: number
  isExpired: boolean
  isLoading: boolean
  error: string | null
}

export function useUserSubscription() {
  const { user } = useAuthContext()
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasActivePlan: false,
    isTrialUser: false,
    subscription: null,
    daysRemaining: 0,
    isExpired: true,
    isLoading: true,
    error: null
  })

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user?.id) {
      console.log('🔍 [useUserSubscription] No user ID found')
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        hasActivePlan: false,
        subscription: null
      }))
      return
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }))
      
      console.log('🔍 [useUserSubscription] Checking subscription for user:', user.id, user.email)
      
      // Verificar se o usuário atual tem uma sessão ativa
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('🔍 [useUserSubscription] Current session:', sessionData?.session?.user?.id)

      // Buscar assinatura ativa do usuário
      const { data: subscriptionData, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            description,
            price,
            duration_days
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single() // Garantir que retorne apenas um resultado ou null

      console.log('🔍 [useUserSubscription] Query result:', { subscriptionData, error })

      if (error && error.code !== 'PGRST116') { // Ignora erro de "não encontrado"
        console.error('❌ [useUserSubscription] Error fetching subscription:', error)
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          error: 'Erro ao verificar assinatura'
        }))
        return
      }

      const subscription = subscriptionData || null
      
      console.log('🔍 [useUserSubscription] Subscription found:', subscription)
      
      if (!subscription) {
        console.log('❌ [useUserSubscription] No active subscription found')
        // Usuário não tem plano ativo
        setStatus(prev => ({
          ...prev,
          hasActivePlan: false,
          isTrialUser: false,
          subscription: null,
          daysRemaining: 0,
          isExpired: true,
          isLoading: false
        }))
        return
      }

      // Verificar se o plano ainda está válido
      const now = new Date()
      const expiresAt = new Date(subscription.expires_at)
      const isExpired = now > expiresAt
      
      // Calcular dias restantes
      const timeDiff = expiresAt.getTime() - now.getTime()
      const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))
      
      // Verificar se é trial (plano gratuito)
      const planName = subscription.subscription_plans?.name?.toLowerCase() || ''
      const isTrialUser = planName.includes('teste') ||
                         planName.includes('trial') ||
                         planName.includes('grátis') ||
                         planName.includes('gratis') ||
                         subscription.subscription_plans?.price === 0

      console.log('🔍 [useUserSubscription] Final status calculation:', {
        isExpired,
        daysRemaining,
        isTrialUser,
        hasActivePlan: !isExpired,
        planName: subscription.subscription_plans?.name,
        expiresAt: subscription.expires_at,
        price: subscription.subscription_plans?.price
      })

      setStatus({
        hasActivePlan: !isExpired,
        isTrialUser,
        subscription,
        daysRemaining,
        isExpired,
        isLoading: false,
        error: null
      })

      // Se o plano expirou, atualizar status no banco
      if (isExpired && subscription.status === 'active') {
        console.log('🔍 [useUserSubscription] Updating expired subscription status')
        await supabase
          .from('user_subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id)
      }

    } catch (error) {
      console.error('Error checking subscription:', error)
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro inesperado ao verificar assinatura'
      }))
    }
  }, [user?.id])

  useEffect(() => {
    checkSubscriptionStatus()
  }, [checkSubscriptionStatus])

  // Refresh subscription status
  const refreshSubscription = useCallback(() => {
    checkSubscriptionStatus()
  }, [checkSubscriptionStatus])

  return {
    ...status,
    refreshSubscription
  }
} 