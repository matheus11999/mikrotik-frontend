# 🎨 MikroPix Frontend - Sistema de Design e Arquitetura

## 📋 Visão Geral

Sistema frontend moderno desenvolvido em React + TypeScript para gerenciamento de MikroTiks, hotspots e infraestrutura de rede. Interface baseada em design system próprio com componentes reutilizáveis e experiência otimizada.

## 🎯 Objetivo do Dashboard

### Propósito Principal
- **Gerenciamento Centralizado**: Controle completo de dispositivos MikroTik e servidores hotspot
- **Automação de Processos**: Templates personalizáveis e configuração automática
- **Monitoramento em Tempo Real**: Status de dispositivos, usuários ativos e métricas
- **Interface Intuitiva**: UX/UI otimizada para administradores de rede

### Público-Alvo
- **Administradores**: Controle total do sistema, usuários e MikroTiks
- **Usuários**: Gestão de seus próprios dispositivos e vendas
- **Provedores**: Monitoramento de infraestrutura e clientes

## 🏗️ Arquitetura Frontend

### Stack Tecnológico
```typescript
- React 18 + TypeScript
- Vite (Build Tool)
- TailwindCSS (Styling)
- Framer Motion (Animations)
- React Router v6 (Navigation)
- Supabase Client (Database)
- Radix UI (Primitives)
- Lucide React (Icons)
```

### Estrutura de Pastas
```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Primitivos e componentes base
│   ├── layout/          # Layout e navegação
│   ├── mikrotik/        # Específicos para MikroTik
│   └── modals/          # Componentes de modal
├── pages/               # Páginas da aplicação
│   ├── dashboard/       # Dashboard principal
│   ├── mikrotiks/       # Gestão de MikroTiks
│   ├── admin/           # Páginas administrativas
│   └── auth/            # Autenticação
├── contexts/            # Context API (Auth, Theme)
├── hooks/               # Custom hooks
├── lib/                 # Configurações e utilitários
└── types/               # TypeScript definitions
```

## 🎨 Sistema de Design

### Paleta de Cores

#### **Cores Primárias**
```css
/* Azul Principal */
--blue-400: #60a5fa     /* Links e elementos interativos */
--blue-500: #3b82f6     /* Botões primários */
--blue-600: #2563eb     /* Hover states */

/* Gradientes de Fundo */
--gradient-main: linear-gradient(to bottom right, black, #1f2937, black)
```

#### **Cores de Status**
```css
/* Sucesso */
--green-400: #4ade80    /* Online, ativo, aprovado */
--green-500: #22c55e    /* Botões de sucesso */

/* Atenção */
--yellow-400: #facc15   /* Warnings, pending */
--orange-500: #f97316   /* Elementos premium */

/* Erro */
--red-400: #f87171      /* Offline, erro, falha */
--red-500: #ef4444      /* Botões de perigo */

/* Neutro */
--purple-400: #a78bfa   /* Admin, especiais */
--gray-400: #9ca3af     /* Texto secundário */
```

#### **Background System**
```css
/* Backgrounds Primários */
--bg-main: gradient-to-br from-black via-gray-900 to-black
--bg-card: black/40 backdrop-blur-sm
--bg-modal: black border-gray-800

/* Borders */
--border-main: border-gray-800/50
--border-hover: border-blue-500/50
```

### Tipografia

#### **Hierarquia de Texto**
```css
/* Headers */
h1: text-2xl sm:text-4xl font-bold (Títulos principais)
h2: text-xl font-semibold (Seções)
h3: text-lg font-semibold (Subsecções)

/* Body Text */
text-sm: 14px (Texto padrão)
text-xs: 12px (Labels, metadados)

/* Gradients */
bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent
```

#### **Fontes**
- **Primary**: Sistema (system-ui, sans-serif)
- **Monospace**: Para IPs, códigos, dados técnicos

### Componentes Base

#### **Button System**
```tsx
// Variantes disponíveis
<Button variant="default">    // Azul padrão
<Button variant="outline">    // Contorno
<Button variant="ghost">      // Transparente
<Button variant="destructive"> // Vermelho (delete)

// Tamanhos
<Button size="sm">   // Pequeno (32px)
<Button size="md">   // Médio (40px - padrão)
<Button size="lg">   // Grande (48px)
```

#### **Card System**
```tsx
// Card padrão com backdrop blur
className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"

// Card hover interativo
className="hover:border-blue-500/50 hover:bg-gray-900/30 transition-all duration-300"
```

#### **Input System**
```tsx
// Input padrão
className="bg-black/40 border-gray-800/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
```

### Animações (Framer Motion)

#### **Padrões de Animação**
```tsx
// Entrada de página
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.1 }}

// Hover de botões
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}

// Cards em lista (stagger)
transition={{ delay: index * 0.1 }}
```

#### **Loading States**
```tsx
// Spinner padrão
<div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />

// Skeleton loading
<div className="h-8 bg-gray-700/30 rounded animate-pulse" />
```

## 🧩 Componentes Principais

### Layout Components

#### **SidebarFixed**
- **Localização**: `src/components/layout/SidebarFixed.tsx`
- **Funcionalidades**:
  - Navegação colapsível
  - Seções organizadas (Rede, Financeiro, Admin)
  - Responsivo com overlay mobile
  - Exibição de saldo do usuário
  - Avatar com iniciais

#### **LayoutFixed**
- **Localização**: `src/components/layout/LayoutFixed.tsx`
- **Funcionalidades**:
  - Container principal da aplicação
  - Responsividade automática
  - Loading overlay inicial
  - Gestão de sidebar mobile

### Dashboard Components

#### **DashboardFinal**
- **Localização**: `src/pages/dashboard/DashboardFinal.tsx`
- **Funcionalidades**:
  - Estatísticas em tempo real
  - Cards de métricas principais
  - Gráficos de performance
  - Atividade recente
  - Dados específicos por role (admin/user)

### UI Primitives

#### **Badge System**
```tsx
// Status badges
<Badge variant="success">Online</Badge>
<Badge variant="destructive">Offline</Badge>
<Badge variant="secondary">Pending</Badge>
```

#### **Toast System**
```tsx
// Notificações contextuais
addToast({
  type: 'success' | 'error' | 'warning' | 'info',
  title: 'Título',
  description: 'Mensagem detalhada'
})
```

## 🔄 Padrões de Desenvolvimento

### Estado e Data Fetching
```tsx
// Padrão de loading state
const [loading, setLoading] = useState(true)
const [data, setData] = useState([])

// Error handling padrão
try {
  setLoading(true)
  const { data, error } = await supabase...
  if (error) throw error
  setData(data)
} catch (error) {
  console.error('Error:', error)
  addToast({ type: 'error', ... })
} finally {
  setLoading(false)
}
```

### Responsividade
```tsx
// Breakpoints TailwindCSS
sm: 640px   // Mobile large
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop

// Padrão de grid responsivo
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

### Routing e Navegação
```tsx
// Estrutura de rotas
/ -> /dashboard (redirect)
/dashboard -> DashboardFinal
/mikrotiks -> MikrotiksList
/users -> UsersManagement (admin only)
/wireguard -> WireGuardManagement (admin only)
```

## 📊 Funcionalidades Implementadas

### Gestão de MikroTiks
- **Lista de dispositivos** com status em tempo real
- **Dashboard individual** por dispositivo
- **Templates de hotspot** personalizáveis
- **Configuração automática** via API

### Sistema de Usuários (Admin)
- **CRUD completo** de usuários
- **Gestão de saldos** com histórico
- **Controle de permissões** (admin/user)
- **Estatísticas detalhadas**

### WireGuard Management
- **Lista de peers** conectados
- **Estatísticas de servidor**
- **QR Codes** para configuração
- **Gestão de conexões**

### Dashboard Analytics
- **Métricas financeiras** (vendas, saldos)
- **Status de dispositivos**
- **Atividade recente**
- **Gráficos interativos**

## 🔧 Configuração e Ambiente

### Variáveis de Ambiente
```bash
# API Backend (VPS1)
VITE_API_URL=https://api.mikropix.online

# Supabase Database
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Scripts Disponíveis
```bash
npm run dev        # Desenvolvimento
npm run build      # Build de produção
npm run preview    # Preview da build
npm run lint       # Linting
npm run clear-cache # Limpar cache
```

## 🎭 UX/UI Guidelines

### Princípios de Design
1. **Clareza**: Informações organizadas e hierarquia visual clara
2. **Consistência**: Padrões visuais e comportamentais uniformes
3. **Responsividade**: Adaptação perfeita a qualquer dispositivo
4. **Performance**: Carregamento rápido e transições suaves
5. **Acessibilidade**: Contraste adequado e navegação por teclado

### Padrões de Interação
- **Feedback imediato** em todas as ações
- **Loading states** durante operações assíncronas
- **Confirmações** para ações destrutivas
- **Tooltips** para elementos que precisam explicação
- **Keyboard shortcuts** para power users

### Hierarquia Visual
```
1. Headers com gradientes e ícones
2. Cards com backdrop blur e borders sutis
3. Estados de hover com scale e cor
4. Badges para status e categorização
5. Spacing consistente (4, 6, 8, 12, 16px)
```

## 🚀 Performance e Otimização

### Bundle Optimization
- **Code splitting** por rotas
- **Lazy loading** de componentes pesados
- **Tree shaking** automático via Vite
- **Asset optimization** para imagens

### Runtime Performance
- **Memoização** de componentes custosos
- **Debounce** em buscas e inputs
- **Virtual scrolling** para listas grandes
- **Efficient re-renders** com React patterns

## 🔮 Roadmap e Extensibilidade

### Arquitetura Preparada Para
- **Novos módulos** via routing dinâmico
- **Temas customizáveis** via CSS variables
- **Componentes adicionais** seguindo design system
- **Integrações externas** via API abstraction
- **Multi-idioma** via i18n preparation

### Padrões de Extensão
```tsx
// Novo componente seguindo padrões
export function NovoComponente() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6"
    >
      {/* Conteúdo */}
    </motion.div>
  )
}
```

---

## 🎨 **Resultado Alcançado**

✅ **Interface Moderna**: Design system consistente e profissional  
✅ **UX Otimizada**: Navegação intuitiva e feedback adequado  
✅ **Performance**: Carregamento rápido e animações suaves  
✅ **Responsivo**: Adaptação perfeita mobile/desktop  
✅ **Extensível**: Arquitetura preparada para crescimento  
✅ **Manutenível**: Código organizado e documentado  

**MikroPix Frontend - Interface de classe enterprise para gestão de infraestrutura de rede! 🚀**

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>