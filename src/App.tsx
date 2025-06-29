import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/ui/toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LayoutFixed } from './components/layout/LayoutFixed'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { DashboardFinal } from './pages/dashboard/DashboardFinal'
import { MikrotiksList } from './pages/mikrotiks/MikrotiksList'
import { MikrotikFormPage } from './pages/mikrotiks/MikrotikForm'
import MikrotikDashboard from './pages/mikrotiks/MikrotikDashboardNew'
import { VendasList } from './pages/vendas/VendasList'
import { TransacoesList } from './pages/transacoes/TransacoesList'
import { SaquesList } from './pages/saques/SaquesList'
import { MacsList } from './pages/macs/MacsList'
import { WireGuardManagement } from './pages/wireguard/WireGuardManagement'
import UsersManagement from './pages/admin/UsersManagement'
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
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute><LayoutFixed /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardFinal />} />
                  
                  {/* MikroTiks */}
                  <Route path="mikrotiks" element={<MikrotiksList />} />
                  <Route path="mikrotiks/new" element={<MikrotikFormPage />} />
                  <Route path="mikrotiks/edit/:id" element={<MikrotikFormPage />} />
                  <Route path="mikrotiks/:mikrotikId/dashboard" element={<MikrotikDashboard />} />
                  
                  {/* Vendas */}
                  <Route path="vendas" element={<VendasList />} />
                  
                  {/* Transações */}
                  <Route path="transacoes" element={<TransacoesList />} />
                  
                  {/* Saques */}
                  <Route path="saques" element={<SaquesList />} />
                  
                  {/* MACs */}
                  <Route path="macs" element={<MacsList />} />
                  
                  {/* WireGuard */}
                  <Route path="wireguard" element={<WireGuardManagement />} />
                  
                  {/* Admin Routes */}
                  <Route path="admin/users" element={<UsersManagement />} />
                </Route>
                
                {/* Redirect any unknown routes to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
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