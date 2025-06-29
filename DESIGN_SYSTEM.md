# 🎨 MikroPix Design System - Documentação Completa

## 📋 Visão Geral

Este documento apresenta o sistema de design completo implementado no MikroPix, incluindo padrões visuais, componentes, animações e diretrizes de uso para criar interfaces consistentes e modernas.

## 🌈 Paleta de Cores

### Cores Primárias
```css
/* Backgrounds */
--bg-primary: linear-gradient(to bottom right, #000000, #1f2937, #000000)
--bg-secondary: rgba(0, 0, 0, 0.4) com backdrop-blur-sm
--bg-card: rgba(0, 0, 0, 0.4) com backdrop-blur-sm

/* Borders */
--border-primary: rgba(156, 163, 175, 0.5) /* gray-800/50 */
--border-secondary: rgba(156, 163, 175, 0.2) /* gray-800/20 */

/* Text */
--text-primary: #ffffff
--text-secondary: #9ca3af /* gray-400 */
--text-gradient: linear-gradient(to right, #ffffff, #d1d5db)
```

### Cores por Categoria
```css
/* Network/MikroTik - Orange */
--orange-primary: #f97316 /* orange-500 */
--orange-bg: rgba(249, 115, 22, 0.1)
--orange-border: rgba(249, 115, 22, 0.2)

/* Dashboard - Blue */
--blue-primary: #3b82f6 /* blue-500 */
--blue-bg: rgba(59, 130, 246, 0.1)
--blue-border: rgba(59, 130, 246, 0.2)

/* Sales - Green */
--green-primary: #10b981 /* green-500 */
--green-bg: rgba(16, 185, 129, 0.1)
--green-border: rgba(16, 185, 129, 0.2)

/* Financial - Purple */
--purple-primary: #8b5cf6 /* purple-500 */
--purple-bg: rgba(139, 92, 246, 0.1)
--purple-border: rgba(139, 92, 246, 0.2)

/* Brand - Cyan */
--cyan-primary: #06b6d4 /* cyan-500 */
--cyan-bg: rgba(6, 182, 212, 0.1)
--cyan-border: rgba(6, 182, 212, 0.2)
```

## 🏗️ Layout e Estrutura

### Container Principal
```tsx
<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-16 lg:pt-0">
  {/* Header fixo */}
  {/* Conteúdo principal */}
</div>
```

### Header Padrão
```tsx
<motion.div 
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm sticky top-0 lg:top-0 z-10"
>
  <div className="px-4 sm:px-6 py-6">
    <div className="flex items-center space-x-4">
      <motion.div 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-[COR]/20 to-[COR]/10 border border-[COR]/20"
      >
        <Icon className="h-6 w-6 text-[COR]" />
      </motion.div>
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
        >
          Título da Página
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400"
        >
          Descrição da página
        </motion.p>
      </div>
    </div>
  </div>
</motion.div>
```

## 🎯 Componentes

### Cards de Estatísticas
```tsx
<motion.div 
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="relative bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-[COR]/10 to-[COR]/5 hover:border-[COR]/30"
>
  <div className="flex items-center justify-between mb-4">
    <div className="p-3 rounded-xl bg-gradient-to-br from-[COR]/10 to-[COR]/5 border border-[COR]/20">
      <Icon className="h-6 w-6 text-[COR]" />
    </div>
  </div>
  <div>
    <p className="text-[COR] text-sm font-medium mb-2">Título</p>
    <p className="text-2xl font-bold text-white">Valor</p>
  </div>
</motion.div>
```

### Cards de Lista
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
  whileHover={{ scale: 1.01 }}
  className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700/50 transition-all duration-300 hover:shadow-2xl"
>
  {/* Conteúdo do card */}
</motion.div>
```

### Formulários e Inputs
```tsx
<Input
  placeholder="Placeholder..."
  className="bg-black/40 backdrop-blur-sm border-gray-800/50 text-white placeholder:text-gray-500 focus:border-[COR] focus:ring-2 focus:ring-[COR]/20 rounded-xl transition-all duration-200"
/>

<motion.select
  whileHover={{ scale: 1.02 }}
  className="bg-black/40 backdrop-blur-sm border border-gray-800/50 text-white rounded-xl focus:border-[COR] focus:ring-2 focus:ring-[COR]/20 transition-all duration-200"
>
  {/* Options */}
</motion.select>
```

### Botões
```tsx
{/* Botão Primário */}
<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  <Button className="bg-[COR] hover:bg-[COR]/80 text-white shadow-lg transition-all duration-200">
    Texto do Botão
  </Button>
</motion.div>

{/* Botão Outline */}
<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  <Button 
    variant="outline" 
    className="border-gray-700 text-gray-300 hover:text-white hover:border-[COR]/50 hover:bg-[COR]/10 transition-all duration-200"
  >
    Texto do Botão
  </Button>
</motion.div>
```

## 🎭 Animações

### Animações de Entrada de Página
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
}
```

### Loading Screens
```tsx
<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-16 lg:pt-0 flex items-center justify-center">
  <motion.div 
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-[COR]/20 border-t-[COR] rounded-full mx-auto mb-6"
    />
    <motion.h3 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2"
    >
      Carregando...
    </motion.h3>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-gray-400"
    >
      Aguarde um momento
    </motion.p>
  </motion.div>
</div>
```

### Estados Vazios
```tsx
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4 }}
  className="flex justify-center py-16"
>
  <div className="text-center max-w-md">
    <motion.div 
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[COR]/20 to-[COR]/10 border border-[COR]/20 flex items-center justify-center backdrop-blur-sm"
    >
      <Icon className="h-12 w-12 text-[COR]" />
    </motion.div>
    <motion.h3 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4"
    >
      Estado Vazio
    </motion.h3>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="text-gray-400 text-lg"
    >
      Descrição do estado vazio
    </motion.p>
  </div>
</motion.div>
```

## 🧩 Sidebar

### Estrutura da Sidebar
```tsx
<motion.aside
  animate={{ 
    width: collapsed ? 80 : 320,
    x: 0 
  }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
  className="hidden lg:flex fixed top-0 left-0 h-full z-40 flex-col bg-black/90 backdrop-blur-xl border-r border-gray-800/50 shadow-2xl"
>
  {/* Header com logo */}
  <div className="p-4 border-b border-gray-800/50">
    {collapsed ? (
      <motion.div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
        <Wifi className="h-5 w-5 text-blue-400" />
      </motion.div>
    ) : (
      <motion.div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
          <Wifi className="h-5 w-5 text-blue-400" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          MikroPix
        </span>
      </motion.div>
    )}
  </div>
  {/* Navigation e Footer */}
</motion.aside>
```

### Dropdowns da Sidebar
```tsx
<motion.button
  onClick={onToggle}
  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-300 transition-colors duration-200 group"
  whileHover={{ x: 2 }}
  whileTap={{ scale: 0.98 }}
>
  <div className="flex items-center gap-2">
    {icon}
    <span>{title}</span>
  </div>
  <motion.div
    animate={{ rotate: expanded ? 180 : 0 }}
    transition={{ duration: 0.2 }}
    className="group-hover:text-white transition-colors duration-200"
  >
    <ChevronDown className="h-3 w-3" />
  </motion.div>
</motion.button>

<AnimatePresence>
  {expanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      {/* Navigation Items */}
    </motion.div>
  )}
</AnimatePresence>
```

## 📱 Responsividade

### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
```

### Padrões Responsivos
```tsx
{/* Grid Responsivo */}
<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

{/* Padding Responsivo */}
<div className="p-4 sm:p-6">

{/* Typography Responsiva */}
<h1 className="text-2xl sm:text-4xl font-bold">

{/* Sidebar Mobile */}
<div className="lg:hidden fixed top-0 left-0 right-0 z-50">
```

## 🎨 Temas por Categoria

### Dashboard (Blue/Cyan)
- **Primary**: Blue (#3b82f6)
- **Secondary**: Cyan (#06b6d4)
- **Usage**: Dashboard principal, métricas gerais

### MikroTiks (Orange)
- **Primary**: Orange (#f97316)
- **Usage**: Páginas relacionadas a MikroTiks, roteadores

### Vendas (Green)
- **Primary**: Green (#10b981)
- **Usage**: Páginas de vendas, estatísticas de receita

### Transações (Blue)
- **Primary**: Blue (#3b82f6)
- **Usage**: Movimentações financeiras

### WireGuard (Purple)
- **Primary**: Purple (#8b5cf6)
- **Usage**: Configurações VPN, segurança

## 🔧 Implementação

### Imports Necessários
```tsx
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from 'lucide-react'
```

### Estrutura Base de Página
```tsx
export function PageName() {
  const [loading, setLoading] = useState(true)
  
  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-16 lg:pt-0">
      <HeaderComponent />
      <div className="p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 sm:space-y-8"
        >
          <FiltersComponent />
          <StatsComponent />
          <ContentComponent />
        </motion.div>
      </div>
    </div>
  )
}
```

## 📋 Checklist de Implementação

### ✅ Completado
- [x] Sidebar com dropdowns colapsáveis
- [x] Logo MikroTik (ícone Wifi) 
- [x] Design da página Dashboard
- [x] Design da página MikroTiks
- [x] Design da página Vendas
- [x] Design da página Transações
- [x] Sistema de cores consistente
- [x] Animações fluidas
- [x] Responsividade mobile/desktop
- [x] Loading screens melhorados
- [x] Estados vazios melhorados

### 🔄 Em Andamento/Pendente
- [ ] Página WireGuard
- [ ] Página Login
- [ ] Página Register
- [ ] MikroTik Dashboard New (completar itens faltantes)

## 🚀 Próximos Passos

1. **Aplicar design às páginas restantes** (Login, Register, WireGuard)
2. **Completar MikroTik Dashboard New** com novos componentes
3. **Otimizar performance** das animações
4. **Implementar dark/light mode** se necessário
5. **Adicionar mais microinterações**

## 📖 Uso Futuro

Para aplicar este design system em novas páginas:

1. **Copie a estrutura base** de uma página existente
2. **Ajuste as cores** conforme a categoria da página
3. **Use os componentes padronizados** (cards, inputs, botões)
4. **Aplique as animações padrão** (containerVariants, itemVariants)
5. **Mantenha a responsividade** com as classes adequadas
6. **Teste em mobile e desktop**

---

**🎨 Design System MikroPix v1.0**

*Documentação criada para manter consistência visual e facilitar desenvolvimento futuro*

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>