// Configuração da API do backend
import { supabase } from '../lib/supabase'

export const API_CONFIG = {
  // Usar a variável de ambiente VITE_API_URL ou fallback para desenvolvimento
  BASE_URL: import.meta.env.VITE_API_URL || 
    (import.meta.env.MODE === 'development' ? 'http://localhost:3000' : 'https://api.mikropix.online'),
  ENDPOINTS: {
    // Autenticação
    AUTH: '/api/auth',
    
    // Pagamentos
    PAYMENT: '/api/payment',
    WEBHOOK: '/api/webhook',
    
    // MikroTik
    MIKROTIK: '/api/mikrotik',
    
    // Subscription
    SUBSCRIPTION: '/api/subscription',
    
    // Health check
    HEALTH: '/health'
  }
}

console.log('API Configuration:', {
  BASE_URL: API_CONFIG.BASE_URL,
  MODE: import.meta.env.MODE,
  VITE_API_URL: import.meta.env.VITE_API_URL
})

// Função utilitária para fazer requisições autenticadas
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`
  
  const defaultHeaders: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Obter token de autenticação diretamente do Supabase
  let token = null
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (!error && session?.access_token) {
      token = session.access_token
    }
  } catch (error) {
    console.warn('Error getting Supabase session:', error)
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
    console.log('API Request with token to:', url)
  } else {
    console.warn('No auth token found for API request to:', url)
  }

  console.log('Making API request to:', url)
  
  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('API Error:', response.status, response.statusText, errorText)
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Funções específicas para cada endpoint
export const api = {
  // MikroTik APIs
  mikrotik: {
    getStats: (mikrotikId: string) => 
      apiRequest(`${API_CONFIG.ENDPOINTS.MIKROTIK}/stats/${mikrotikId}`),
    
    getHotspotUsers: (mikrotikId: string) => 
      apiRequest(`${API_CONFIG.ENDPOINTS.MIKROTIK}/hotspot/users/${mikrotikId}`),
    
    getActiveUsers: (mikrotikId: string) => 
      apiRequest(`${API_CONFIG.ENDPOINTS.MIKROTIK}/hotspot/active-users/${mikrotikId}`),
    
    getProfiles: (mikrotikId: string) => 
      apiRequest(`${API_CONFIG.ENDPOINTS.MIKROTIK}/hotspot/profiles/${mikrotikId}`),
    
    createUser: (mikrotikId: string, userData: any) => 
      apiRequest(`${API_CONFIG.ENDPOINTS.MIKROTIK}/hotspot/users/${mikrotikId}`, {
        method: 'POST',
        body: JSON.stringify(userData)
      }),
    
    createProfile: (mikrotikId: string, profileData: any) => 
      apiRequest(`${API_CONFIG.ENDPOINTS.MIKROTIK}/hotspot/profiles/${mikrotikId}`, {
        method: 'POST',
        body: JSON.stringify(profileData)
      }),
    
    disconnectUser: (mikrotikId: string, userId: string) => 
      apiRequest(`${API_CONFIG.ENDPOINTS.MIKROTIK}/hotspot/disconnect/${mikrotikId}/${userId}`, {
        method: 'POST'
      }),
    
    checkConnection: (mikrotikId: string) => 
      apiRequest(`${API_CONFIG.ENDPOINTS.MIKROTIK}/check-connection/${mikrotikId}`)
  },

  // Subscription APIs
  subscription: {
    createPayment: (planData: any) => 
      apiRequest(`${API_CONFIG.ENDPOINTS.SUBSCRIPTION}/create-payment`, {
        method: 'POST',
        body: JSON.stringify(planData)
      }),
    
    getPaymentStatus: (paymentId: string) => 
      apiRequest(`${API_CONFIG.ENDPOINTS.SUBSCRIPTION}/payment-status/${paymentId}`)
  },

  // Health check
  health: () => apiRequest(API_CONFIG.ENDPOINTS.HEALTH)
}