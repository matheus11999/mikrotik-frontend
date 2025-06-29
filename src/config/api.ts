// Configuração da API do backend
export const API_CONFIG = {
  // Em desenvolvimento usa URL relativa (proxy), em produção usa URL completa
  BASE_URL: import.meta.env.MODE === 'development' 
    ? '' // URL relativa para usar o proxy
    : 'https://api.mikropix.online',
  ENDPOINTS: {
    // Autenticação
    AUTH: '/api/auth',
    
    // Pagamentos
    PAYMENT: '/api/payment',
    WEBHOOK: '/api/webhook',
    
    // MikroTik
    MIKROTIK: '/api/mikrotik',
    
    // Health check
    HEALTH: '/health'
  }
}

// Função utilitária para fazer requisições autenticadas
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`
  
  const defaultHeaders: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Adicionar token de autenticação se disponível (Supabase)
  // Tentar múltiplas fontes para o token
  let token = null
  
  // 1. Tentar de supabase-auth-token
  const supabaseToken = localStorage.getItem('supabase-auth-token')
  if (supabaseToken) {
    try {
      const parsed = JSON.parse(supabaseToken)
      token = parsed.access_token
    } catch (e) {
      // Ignore parse error
    }
  }
  
  // 2. Tentar de sb-api-auth-token
  if (!token) {
    const sbToken = localStorage.getItem('sb-api-auth-token')
    if (sbToken) {
      try {
        const parsed = JSON.parse(sbToken)
        token = parsed.access_token
      } catch (e) {
        // Ignore parse error
      }
    }
  }
  
  // 3. Tentar método antigo
  if (!token) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user?.session?.access_token) {
      token = user.session.access_token
    }
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  })

  if (!response.ok) {
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

  // Health check
  health: () => apiRequest(API_CONFIG.ENDPOINTS.HEALTH)
}