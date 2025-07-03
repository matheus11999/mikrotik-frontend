import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'
import { useUserSubscription } from '../hooks/useUserSubscription'
import { useEffect } from 'react'
import { useToast } from '../components/ui/toast'

interface PlanRestrictedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user'
  allowTrialUsers?: boolean // Se true, usuários com trial podem acessar
}

export function PlanRestrictedRoute({ 
  children, 
  requiredRole, 
  allowTrialUsers = true 
}: PlanRestrictedRouteProps) {
  const { user, loading: authLoading } = useAuthContext()
  const { addToast } = useToast()
  const { 
    hasActivePlan, 
    isTrialUser, 
    isLoading: subscriptionLoading, 
    daysRemaining,
    subscription 
  } = useUserSubscription()

  // Loading state
  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check role permissions
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/app/dashboard" replace />
  }

  // Admin users always have access
  if (user.role === 'admin') {
    return <>{children}</>
  }

  // Check if user has active plan
  const canAccess = hasActivePlan && (allowTrialUsers || !isTrialUser)

  if (!canAccess) {
    // Show notification about expired plan
    if (!hasActivePlan) {
      addToast({
        type: 'error',
        title: '⚠️ Plano Expirado',
        description: 'Seu plano expirou. Renove para continuar acessando todas as funcionalidades.',
      })
    }

    return <Navigate to="/app/dashboard" replace />
  }

  // Show warning for users with plans expiring soon
  if (hasActivePlan && daysRemaining <= 3 && daysRemaining > 0) {
    const planName = subscription?.subscription_plans?.name || 'seu plano'
    addToast({
      type: 'warning',
      title: '⏰ Plano Expirando',
      description: `${planName} expira em ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}. Renove para continuar usando.`,
    })
  }

  return <>{children}</>
}

// Componente helper para mostrar status do plano no dashboard
export function PlanStatusBanner() {
  const { 
    hasActivePlan, 
    isTrialUser, 
    daysRemaining, 
    subscription, 
    isLoading 
  } = useUserSubscription()

  if (isLoading) return null

  if (!hasActivePlan) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-sm">⚠️</span>
          </div>
          <div className="flex-1">
            <h3 className="text-red-400 font-medium">Plano Expirado</h3>
            <p className="text-red-300/80 text-sm">
              Seu plano expirou. Renove para acessar todas as funcionalidades.
            </p>
          </div>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Renovar Plano
          </button>
        </div>
      </div>
    )
  }

  if (daysRemaining <= 7) {
    const planName = subscription?.subscription_plans?.name || 'Seu plano'
    const isUrgent = daysRemaining <= 3
    
    return (
      <div className={`${isUrgent ? 'bg-orange-500/10 border-orange-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} border rounded-lg p-4 mb-6`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${isUrgent ? 'bg-orange-500/20' : 'bg-yellow-500/20'} flex items-center justify-center`}>
            <span className={`${isUrgent ? 'text-orange-400' : 'text-yellow-400'} text-sm`}>⏰</span>
          </div>
          <div className="flex-1">
            <h3 className={`${isUrgent ? 'text-orange-400' : 'text-yellow-400'} font-medium`}>
              {isUrgent ? 'Plano Expirando em Breve' : 'Lembrete de Renovação'}
            </h3>
            <p className={`${isUrgent ? 'text-orange-300/80' : 'text-yellow-300/80'} text-sm`}>
              {planName} expira em {daysRemaining} dia{daysRemaining > 1 ? 's' : ''}. 
              {isTrialUser ? ' Considere fazer upgrade para um plano pago.' : ' Renove para continuar usando.'}
            </p>
          </div>
          <button className={`${isUrgent ? 'bg-orange-500 hover:bg-orange-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}>
            {isTrialUser ? 'Fazer Upgrade' : 'Renovar'}
          </button>
        </div>
      </div>
    )
  }

  return null
} 