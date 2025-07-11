/**
 * 🔑 Sistema de Geração de Senhas para MikroTik
 * 
 * Utilitário para geração em lote de usuários e senhas para hotspot MikroTik
 * Gera códigos de 5 dígitos numéricos onde usuário = senha
 */

export interface PasswordGenerationConfig {
  quantity: number
  profile: string
  prefix?: string
  suffix?: string
  valor?: number
  session_timeout?: string
}

export interface GeneratedUser {
  username: string
  password: string
  profile: string
  comment?: string
}

export interface GenerationResult {
  users: GeneratedUser[]
  total: number
  errors: string[]
  summary: {
    generated: number
    failed: number
    duplicates: number
  }
}

/**
 * Converte session_timeout para texto legível
 * @param sessionTimeout Session timeout em formato MikroTik (ex: "1h", "30m", "3600")
 * @returns Texto legível (ex: "1 hora", "30 minutos")
 */
export const formatSessionTimeout = (sessionTimeout?: string): string => {
  if (!sessionTimeout) return 'Sem limite'
  
  const timeout = sessionTimeout.toString().toLowerCase()
  
  if (timeout.endsWith('h')) {
    const hours = parseInt(timeout.replace('h', ''))
    return hours === 1 ? '1 hora' : `${hours} horas`
  } else if (timeout.endsWith('m')) {
    const minutes = parseInt(timeout.replace('m', ''))
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`
  } else if (timeout.includes(':')) {
    // Formato HH:MM:SS
    const parts = timeout.split(':')
    const hours = parseInt(parts[0])
    const minutes = parseInt(parts[1])
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h${minutes}m`
    } else if (hours > 0) {
      return hours === 1 ? '1 hora' : `${hours} horas`
    } else if (minutes > 0) {
      return minutes === 1 ? '1 minuto' : `${minutes} minutos`
    }
  } else {
    // Formato em segundos
    const seconds = parseInt(timeout)
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600)
      return hours === 1 ? '1 hora' : `${hours} horas`
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60)
      return minutes === 1 ? '1 minuto' : `${minutes} minutos`
    } else {
      return `${seconds} segundos`
    }
  }
  
  return 'Sem limite'
}

/**
 * Converte session_timeout para minutos (para comentários)
 * @param sessionTimeout Session timeout em formato MikroTik (ex: "1h", "30m", "3600")
 * @returns Duração em minutos (ex: "60 minutos", "30 minutos")
 */
export const formatSessionTimeoutInMinutes = (sessionTimeout?: string): string => {
  if (!sessionTimeout) return 'Sem limite'
  
  const timeout = sessionTimeout.toString().toLowerCase()
  
  if (timeout.endsWith('h')) {
    const hours = parseInt(timeout.replace('h', ''))
    const minutes = hours * 60
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`
  } else if (timeout.endsWith('m')) {
    const minutes = parseInt(timeout.replace('m', ''))
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`
  } else if (timeout.includes(':')) {
    // Formato HH:MM:SS
    const parts = timeout.split(':')
    const hours = parseInt(parts[0])
    const mins = parseInt(parts[1])
    const totalMinutes = (hours * 60) + mins
    
    return totalMinutes === 1 ? '1 minuto' : `${totalMinutes} minutos`
  } else {
    // Formato em segundos
    const seconds = parseInt(timeout)
    const minutes = Math.floor(seconds / 60)
    
    if (minutes >= 1) {
      return minutes === 1 ? '1 minuto' : `${minutes} minutos`
    } else {
      return `${seconds} segundos`
    }
  }
  
  return 'Sem limite'
}

/**
 * Gera um código numérico aleatório de 5 dígitos
 * @returns string com 5 dígitos (ex: "12345")
 */
export const generateFiveDigitCode = (): string => {
  // Gera número entre 10000 e 99999 para garantir 5 dígitos
  const min = 10000
  const max = 99999
  const code = Math.floor(Math.random() * (max - min + 1)) + min
  return code.toString()
}

/**
 * Gera múltiplos códigos únicos
 * @param quantity Quantidade de códigos a gerar
 * @param existingCodes Códigos já existentes para evitar duplicatas
 * @returns Array de códigos únicos
 */
export const generateUniqueCodes = (
  quantity: number, 
  existingCodes: Set<string> = new Set()
): string[] => {
  const codes = new Set<string>(existingCodes)
  const newCodes: string[] = []
  
  let attempts = 0
  const maxAttempts = quantity * 10 // Evita loop infinito
  
  while (newCodes.length < quantity && attempts < maxAttempts) {
    const code = generateFiveDigitCode()
    
    if (!codes.has(code)) {
      codes.add(code)
      newCodes.push(code)
    }
    
    attempts++
  }
  
  return newCodes
}

/**
 * Valida a configuração de geração
 * @param config Configuração da geração
 * @returns Array de erros (vazio se válido)
 */
export const validateGenerationConfig = (config: PasswordGenerationConfig): string[] => {
  const errors: string[] = []
  
  // Validar quantidade
  if (!config.quantity || config.quantity < 1) {
    errors.push('Quantidade deve ser maior que 0')
  }
  
  if (config.quantity > 500) {
    errors.push('Quantidade máxima é 500 usuários por vez')
  }
  
  // Validar perfil
  if (!config.profile || config.profile.trim() === '') {
    errors.push('Perfil é obrigatório')
  }
  
  // Permitir perfis com espaços (nomes como "1 Hora - 10MB")
  
  return errors
}

/**
 * Gera lista de usuários com senhas
 * @param config Configuração da geração
 * @param existingUsernames Nomes de usuários já existentes
 * @returns Resultado da geração
 */
export const generatePasswordBatch = (
  config: PasswordGenerationConfig,
  existingUsernames: string[] = []
): GenerationResult => {
  const result: GenerationResult = {
    users: [],
    total: config.quantity,
    errors: [],
    summary: {
      generated: 0,
      failed: 0,
      duplicates: 0
    }
  }
  
  // Validar configuração
  const configErrors = validateGenerationConfig(config)
  if (configErrors.length > 0) {
    result.errors = configErrors
    result.summary.failed = config.quantity
    return result
  }
  
  try {
    // Criar Set com usuários existentes para verificação rápida
    const existingSet = new Set(existingUsernames.map(name => name.toLowerCase()))
    
    // Gerar códigos únicos
    const codes = generateUniqueCodes(config.quantity, new Set(existingUsernames))
    
    if (codes.length < config.quantity) {
      result.errors.push(`Só foi possível gerar ${codes.length} códigos únicos de ${config.quantity} solicitados`)
    }
    
    // Criar usuários
    codes.forEach((code, index) => {
      try {
        const username = `${config.prefix || ''}${code}${config.suffix || ''}`
        const password = username // Senha igual ao username completo
        
        // Verificar se já existe
        if (existingSet.has(username.toLowerCase())) {
          result.summary.duplicates++
          result.errors.push(`Usuário ${username} já existe`)
          return
        }
        
        // Criar usuário
        const durationText = formatSessionTimeoutInMinutes(config.session_timeout)
        const user: GeneratedUser = {
          username,
          password,
          profile: config.profile,
          comment: `Plano: ${config.profile} - Valor: R$ ${(config.valor || 0).toFixed(2)} - Duração: ${durationText} - Gerado ${new Date().toLocaleDateString('pt-BR')}`
        }
        
        result.users.push(user)
        result.summary.generated++
        
      } catch (error) {
        result.summary.failed++
        result.errors.push(`Erro ao gerar usuário ${index + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    })
    
  } catch (error) {
    result.errors.push(`Erro geral na geração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    result.summary.failed = config.quantity
  }
  
  return result
}

/**
 * Formata o resultado da geração para exibição
 * @param result Resultado da geração
 * @returns String formatada com resumo
 */
export const formatGenerationSummary = (result: GenerationResult): string => {
  const { summary } = result
  
  let text = `✅ ${summary.generated} usuários gerados com sucesso`
  
  if (summary.failed > 0) {
    text += `\n❌ ${summary.failed} falharam`
  }
  
  if (summary.duplicates > 0) {
    text += `\n⚠️ ${summary.duplicates} duplicatas encontradas`
  }
  
  if (result.errors.length > 0) {
    text += `\n\n📋 Detalhes dos erros:\n${result.errors.slice(0, 5).join('\n')}`
    
    if (result.errors.length > 5) {
      text += `\n... e mais ${result.errors.length - 5} erros`
    }
  }
  
  return text
}

/**
 * Converte usuários gerados para formato de envio para API
 * @param users Lista de usuários gerados
 * @param mikrotikParams Parâmetros adicionais do MikroTik
 * @returns Array formatado para API
 */
export const formatUsersForAPI = (
  users: GeneratedUser[],
  mikrotikParams: any = {}
): Array<{
  name: string
  password: string
  profile: string
  comment?: string
  disabled?: boolean
}> => {
  return users.map(user => ({
    name: user.username,
    password: user.password || user.username,
    profile: user.profile,
    comment: user.comment,
    disabled: false,
    ...mikrotikParams
  }))
}

/**
 * Estima o tempo de criação baseado na quantidade
 * @param quantity Quantidade de usuários
 * @returns Tempo estimado em segundos
 */
export const estimateCreationTime = (quantity: number): number => {
  // Estima ~200ms por usuário (incluindo rede + processamento)
  const timePerUser = 0.2
  const baseTime = 2 // Tempo base de conexão
  
  return Math.ceil(baseTime + (quantity * timePerUser))
}

/**
 * Formata tempo em segundos para string legível
 * @param seconds Tempo em segundos
 * @returns String formatada (ex: "2m 30s")
 */
export const formatEstimatedTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (remainingSeconds === 0) {
    return `${minutes}m`
  }
  
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Gera dados de exemplo para preview
 * @param profile Nome do perfil
 * @param quantity Quantidade de exemplos (máximo 5)
 * @returns Array com exemplos de usuários
 */
export const generatePreviewData = (profile: string, quantity: number = 3): GeneratedUser[] => {
  const previewQuantity = Math.min(quantity, 5)
  const codes = generateUniqueCodes(previewQuantity)
  
  return codes.map((code, index) => ({
    username: code,
    password: code,
    profile,
    comment: `Exemplo ${index + 1}`
  }))
}

// Constantes úteis
export const PASSWORD_GENERATION_LIMITS = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 500,
  CODE_LENGTH: 5,
  MAX_ATTEMPTS_MULTIPLIER: 10
} as const

export const PASSWORD_GENERATION_MESSAGES = {
  SUCCESS: 'Usuários gerados com sucesso!',
  PARTIAL_SUCCESS: 'Alguns usuários foram gerados com problemas',
  FAILED: 'Falha na geração de usuários',
  VALIDATION_ERROR: 'Erro de validação nos dados fornecidos',
  NETWORK_ERROR: 'Erro de conexão com o servidor',
  MIKROTIK_ERROR: 'Erro na conexão com o MikroTik'
} as const