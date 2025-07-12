# 🎨 MikroPix Design System - Guia de Migração

## 📋 Visão Geral

Este guia mostra como migrar componentes existentes para usar o novo sistema de design unificado do MikroPix, garantindo consistência visual entre landing page e dashboard.

## 🚀 Componentes Unificados Disponíveis

### 1. UnifiedCard

Substitui cards diferentes espalhados pelo código.

**Antes:**
```tsx
// Landing Page
<div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
  {content}
</div>

// Dashboard
<div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-4">
  {content}
</div>
```

**Depois:**
```tsx
import { UnifiedCard } from '../ui/unified'

// Para ambos - Landing e Dashboard
<UnifiedCard variant="default" hover animation>
  {content}
</UnifiedCard>

// Variantes específicas
<UnifiedCard variant="landing">Landing content</UnifiedCard>
<UnifiedCard variant="stats">Stats content</UnifiedCard>
<UnifiedCard variant="glass">Glass effect</UnifiedCard>
```

### 2. UnifiedIcon

Padroniza containers de ícones e cores.

**Antes:**
```tsx
// Landing
<div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 rounded-xl">
  <Wifi className="w-6 h-6 text-blue-400" />
</div>

// Dashboard
<div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
  <Router className="h-5 w-5 text-orange-400" />
</div>
```

**Depois:**
```tsx
import { UnifiedIcon } from '../ui/unified'
import { Wifi, Router } from 'lucide-react'

<UnifiedIcon icon={Wifi} color="blue" size="lg" />
<UnifiedIcon icon={Router} color="orange" size="md" />

// Ícone simples sem container
<UnifiedIcon icon={Wifi} variant="simple" color="blue" size="md" />
```

### 3. UnifiedBadge

Status badges consistentes.

**Antes:**
```tsx
// Diversos padrões espalhados
<span className="text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full text-xs">
  Online
</span>
```

**Depois:**
```tsx
import { UnifiedBadge } from '../ui/unified'

<UnifiedBadge variant="online">Online</UnifiedBadge>
<UnifiedBadge variant="offline">Offline</UnifiedBadge>
<UnifiedBadge variant="warning">Warning</UnifiedBadge>
<UnifiedBadge variant="success">Success</UnifiedBadge>
```

### 4. UnifiedTypography

Hierarquia de texto consistente.

**Antes:**
```tsx
// Landing
<h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
  Título Hero
</h1>

// Dashboard
<h2 className="text-2xl sm:text-4xl font-bold">
  Título Dashboard
</h2>
```

**Depois:**
```tsx
import { UnifiedTypography } from '../ui/unified'

<UnifiedTypography variant="hero" gradient>
  Título Hero
</UnifiedTypography>

<UnifiedTypography variant="title">
  Título Dashboard
</UnifiedTypography>

<UnifiedTypography variant="heading">
  Subtítulo
</UnifiedTypography>
```

### 5. UnifiedButton

Botões padronizados com animações.

**Antes:**
```tsx
// Vários padrões diferentes
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
  Botão
</button>
```

**Depois:**
```tsx
import { UnifiedButton } from '../ui/unified'
import { Plus } from 'lucide-react'

<UnifiedButton variant="primary" size="md" icon={Plus}>
  Adicionar
</UnifiedButton>

<UnifiedButton variant="secondary" loading>
  Carregando...
</UnifiedButton>

<UnifiedButton variant="destructive" animation={false}>
  Deletar
</UnifiedButton>
```

## 🎨 Classes CSS Utilitárias

### Uso Direto das Classes

Para casos onde componentes React não são adequados:

```tsx
// Cards
<div className="mikropix-card mikropix-card-hover mikropix-spacing-card">
  Conteúdo do card
</div>

// Inputs
<input className="mikropix-input" />

// Texto com gradiente
<h1 className="mikropix-text-hero mikropix-text-gradient">
  Título com gradiente
</h1>

// Container de ícone
<div className="mikropix-icon-container mikropix-icon-blue">
  <Icon />
</div>

// Grids responsivos
<div className="mikropix-grid-responsive">
  <!-- cards -->
</div>

<div className="mikropix-grid-stats">
  <!-- estatísticas -->
</div>
```

## 📊 Exemplos de Migração Completa

### Migração de Card de Estatística

**Antes:**
```tsx
<div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
  <div className="flex items-center gap-3">
    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
      <BarChart3 className="h-6 w-6 text-blue-400" />
    </div>
    <div>
      <h3 className="text-xl font-bold text-white">150</h3>
      <p className="text-sm text-gray-400">Usuários Online</p>
    </div>
  </div>
</div>
```

**Depois:**
```tsx
import { UnifiedCard, UnifiedIcon, UnifiedTypography } from '../ui/unified'
import { BarChart3 } from 'lucide-react'

<UnifiedCard variant="default" hover animation>
  <div className="flex items-center gap-3">
    <UnifiedIcon icon={BarChart3} color="blue" size="lg" />
    <div>
      <UnifiedTypography variant="heading" className="text-white">
        150
      </UnifiedTypography>
      <UnifiedTypography variant="caption">
        Usuários Online
      </UnifiedTypography>
    </div>
  </div>
</UnifiedCard>
```

### Migração de Seção Hero (Landing)

**Antes:**
```tsx
<section className="py-20 px-4">
  <div className="text-center">
    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
      MikroPix Platform
    </h1>
    <p className="text-xl text-gray-300 mb-8">
      Gerencie sua rede com facilidade
    </p>
    <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium">
      Começar Agora
    </button>
  </div>
</section>
```

**Depois:**
```tsx
import { UnifiedTypography, UnifiedButton } from '../ui/unified'

<section className="mikropix-spacing-section">
  <div className="text-center">
    <UnifiedTypography variant="hero" gradient className="mb-6">
      MikroPix Platform
    </UnifiedTypography>
    <UnifiedTypography variant="body" className="text-xl text-gray-300 mb-8">
      Gerencie sua rede com facilidade
    </UnifiedTypography>
    <UnifiedButton variant="primary" size="lg">
      Começar Agora
    </UnifiedButton>
  </div>
</section>
```

## 🔄 Estratégia de Migração Gradual

### Fase 1: Novos Componentes
- Use componentes unificados em **novos desenvolvimentos**
- Mantenha código existente funcionando

### Fase 2: Componentes Críticos
- Migre **páginas principais** (Dashboard, Landing)
- Migre **componentes mais usados**

### Fase 3: Migração Completa
- Substitua **todos os componentes** restantes
- Remove classes CSS antigas não utilizadas

## 🎯 Benefícios da Migração

### ✅ Consistência Visual
- **Mesmo padrão** em toda aplicação
- **Cores unificadas** entre páginas
- **Espaçamentos** padronizados

### ✅ Manutenibilidade
- **Uma única fonte** de verdade para estilos
- **Mudanças centralizadas** nos tokens CSS
- **Componentes reutilizáveis**

### ✅ Performance
- **CSS otimizado** com classes utilitárias
- **Bundle menor** com componentes compartilhados
- **Animações consistentes**

### ✅ Developer Experience
- **TypeScript** com types bem definidos
- **Autocompletar** no IDE
- **Props padronizadas**

## 🧪 Testes Visuais

Após migração, teste em:

1. **Desktop** (1920x1080, 1366x768)
2. **Tablet** (768x1024)
3. **Mobile** (375x667, 414x896)
4. **Temas** (certifique-se de funcionar no tema escuro)

## 📚 Referência Rápida

```tsx
// Imports essenciais
import { 
  UnifiedCard, 
  UnifiedIcon, 
  UnifiedBadge, 
  UnifiedTypography, 
  UnifiedButton 
} from '../ui/unified'

// Card padrão
<UnifiedCard variant="default" hover>...</UnifiedCard>

// Ícone com container
<UnifiedIcon icon={MyIcon} color="blue" size="md" />

// Badge de status
<UnifiedBadge variant="online">Online</UnifiedBadge>

// Texto com hierarquia
<UnifiedTypography variant="title">Título</UnifiedTypography>

// Botão com ícone
<UnifiedButton variant="primary" icon={Plus}>Adicionar</UnifiedButton>
```

---

## 🎉 Resultado Final

Com essa migração, teremos:
- **Interface visual 100% consistente**
- **Código mais limpo e mantível**
- **Performance otimizada**
- **Experiência de desenvolvimento melhor**

A migração pode ser feita de forma gradual, garantindo que a aplicação continue funcionando durante todo o processo.