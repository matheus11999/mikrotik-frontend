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

      if (error) {
        console.error('Error fetching subscription:', error)
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          error: 'Erro ao verificar assinatura'
        }))
        return
      }

      const subscription = subscriptionData?.[0] || null
      
      if (!subscription) {
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
      const isTrialUser = subscription.subscription_plans?.name?.toLowerCase().includes('teste') ||
                         subscription.subscription_plans?.name?.toLowerCase().includes('trial') ||
                         subscription.subscription_plans?.name?.toLowerCase().includes('grátis') ||
                         subscription.subscription_plans?.price === 0

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