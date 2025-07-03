import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/ui/toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PlanRestrictedRoute } from './components/PlanRestrictedRoute'
import { LayoutFixed } from './components/layout/LayoutFixed'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { DashboardFinal } from './pages/dashboard/DashboardFinal'
import LandingPage from './pages/LandingPage'
import { MikrotiksList } from './pages/mikrotiks/MikrotiksList'
import { MikrotikFormPage } from './pages/mikrotiks/MikrotikForm'
import MikrotikDashboard from './pages/mikrotiks/MikrotikDashboardNew'
import VendasList from './pages/vendas/VendasList'
import { TransacoesList } from './pages/transacoes/TransacoesList'
import { SaquesList } from './pages/saques/SaquesList'
import { WireGuardManagement } from './pages/wireguard/WireGuardManagement'
import UsersManagement from './pages/admin/UsersManagement'
import { SystemSettings } from './pages/admin/SystemSettings'
import { UserSettings } from './pages/settings/UserSettings'
import { useEffect } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // SEM cache
      gcTime: 0,    // Remove imediatamente
      retry: 1,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
})

// Configurações para React Router v7
const routerProps = {
  future: {
    v7_relativeSplatPath: true,
    v7_startTransition: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
}

function App() {
  // Prevenir recarregamentos desnecessários quando a página volta ao foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Não fazer nada quando a visibilidade muda
      // Isso previne recarregamentos automáticos
    }

    const handleFocus = () => {
      // Não fazer nada quando a janela ganha foco
      // Isso previne recarregamentos automáticos
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router {...routerProps}>
            <div className="min-h-screen bg-black">
              <PWAInstallPrompt />
              <Routes>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/app" element={<ProtectedRoute><LayoutFixed /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/app/dashboard" replace />} />
                  
                  {/* Dashboard - Sempre acessível para usuários logados */}
                  <Route path="dashboard" element={<DashboardFinal />} />
                  
                  {/* User Settings - Sempre acessível */}
                  <Route path="settings" element={<UserSettings />} />
                  
                  {/* MikroTiks - Requer plano ativo */}
                  <Route path="mikrotiks" element={<PlanRestrictedRoute><MikrotiksList /></PlanRestrictedRoute>} />
                  <Route path="mikrotiks/new" element={<PlanRestrictedRoute><MikrotikFormPage /></PlanRestrictedRoute>} />
                  <Route path="mikrotiks/edit/:id" element={<PlanRestrictedRoute><MikrotikFormPage /></PlanRestrictedRoute>} />
                  <Route path="mikrotiks/:mikrotikId/dashboard" element={<PlanRestrictedRoute allowTrialUsers={false}><MikrotikDashboard /></PlanRestrictedRoute>} />
                  
                  {/* Vendas - Requer plano ativo */}
                  <Route path="vendas" element={<PlanRestrictedRoute><VendasList /></PlanRestrictedRoute>} />
                  
                  {/* Transações - Requer plano ativo */}
                  <Route path="transacoes" element={<PlanRestrictedRoute><TransacoesList /></PlanRestrictedRoute>} />
                  
                  {/* Saques - Requer plano ativo */}
                  <Route path="saques" element={<PlanRestrictedRoute><SaquesList /></PlanRestrictedRoute>} />
                  
                  {/* WireGuard - Requer plano ativo */}
                  <Route path="wireguard" element={<PlanRestrictedRoute><WireGuardManagement /></PlanRestrictedRoute>} />
                  
                  {/* Admin Routes - Admin sempre tem acesso */}
                  <Route path="users" element={<PlanRestrictedRoute requiredRole="admin"><UsersManagement /></PlanRestrictedRoute>} />
                  <Route path="admin/settings" element={<PlanRestrictedRoute requiredRole="admin"><SystemSettings /></PlanRestrictedRoute>} />
                </Route>
                
                {/* Redirect any unknown routes to dashboard */}
                <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
              </Routes>
            </div>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App