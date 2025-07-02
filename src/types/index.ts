export interface User {
  id: string
  email: string
  nome: string
  role: 'admin' | 'user'
  saldo: number
  telefone?: string
  cpf?: string
  pix_key?: string
  whatsapp?: string
  chave_pix?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Mikrotik {
  id: string
  nome: string
  user_id: string
  porcentagem: number
  ip_address?: string
  porta?: number
  usuario?: string
  senha?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Venda {
  id: string
  user_id: string
  mikrotik_id: string
  valor: number
  plano_nome: string
  plano_valor: number
  plano_minutos: number
  mac_address: string
  comissao_valor: number
  created_at: string
  mikrotik?: Mikrotik
  user?: User
}

export interface Transacao {
  id: string
  user_id: string
  tipo: 'credito' | 'debito'
  motivo: string
  valor: number
  referencia_id?: string
  referencia_tipo?: string
  saldo_anterior: number
  saldo_atual: number
  created_at: string
}

export interface Mac {
  id: string
  mac_address: string
  mikrotik_id: string
  data_primeiro_registro: string
  total_compras: number
  valor_total_compras: number
  status: 'ativo' | 'inativo' | 'bloqueado'
  ultima_compra?: string
  created_at: string
  updated_at: string
  mikrotik?: Mikrotik
}

export interface Saque {
  id: string
  user_id: string
  valor: number
  status: 'pendente' | 'aprovado' | 'rejeitado'
  pix_key: string
  observacoes?: string
  data_solicitacao: string
  data_aprovacao?: string
  aprovado_por?: string
  created_at: string
  updated_at: string
  user?: User
}

export interface DashboardStats {
  totalVendas: number
  saldoAcumulado: number
  topUsuarios: Array<{
    user: User
    saldo: number
  }>
  topMikrotiks: Array<{
    mikrotik: Mikrotik
    vendas: number
  }>
}