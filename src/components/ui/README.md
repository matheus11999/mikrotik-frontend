# 🎨 Sistema de Componentes UI - MikroPix

Sistema unificado de componentes UI para garantir consistência, reutilização e manutenibilidade em todo o frontend.

## 📦 Componentes Disponíveis

### 🪟 **Modal System**

#### `Modal` - Modal Base
```tsx
import { Modal, ModalContent, ModalFooter } from '@/components/ui'

<Modal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Título do Modal"
  description="Descrição opcional"
  size="md" // sm | md | lg | xl | full
  showCloseButton={true}
  closeOnOverlayClick={true}
>
  <ModalContent>
    {/* Conteúdo */}
  </ModalContent>
  
  <ModalFooter>
    <Button variant="outline">Cancelar</Button>
    <Button>Confirmar</Button>
  </ModalFooter>
</Modal>
```

#### `ConfirmDialog` - Diálogo de Confirmação
```tsx
import { ConfirmDialog } from '@/components/ui'

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="Confirmar ação"
  description="Esta ação não pode ser desfeita"
  confirmText="Confirmar"
  cancelText="Cancelar"
  variant="destructive" // default | destructive
  loading={processing}
  onConfirm={handleConfirm}
/>
```

### 🪝 **Hooks para Modais**

#### `useModal` - Gerenciar estado do modal
```tsx
import { useModal } from '@/components/ui'

const modal = useModal()

// Métodos disponíveis:
modal.isOpen    // boolean
modal.open()    // abrir modal
modal.close()   // fechar modal
modal.toggle()  // alternar estado
modal.setOpen(boolean) // definir estado
```

#### `useConfirm` - Diálogo de confirmação com promise
```tsx
import { useConfirm } from '@/components/ui'

const { confirm, ConfirmComponent } = useConfirm()

// Usar em async functions
const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Deletar item',
    description: 'Esta ação é permanente',
    variant: 'destructive'
  })
  
  if (confirmed) {
    // executar ação
  }
}

// Renderizar no componente
return (
  <>
    {/* Seu componente */}
    <ConfirmComponent />
  </>
)
```

### 🔄 **Loading Components**

#### `UnifiedLoading` - Sistema de Loading Unificado ⭐
```tsx
import { 
  UnifiedLoading, 
  DashboardLoading, 
  ListLoading, 
  TableLoading,
  PageLoading,
  StatsLoading 
} from '@/components/ui'

// Componentes específicos (recomendado)
<DashboardLoading isLoading={loading} message="Carregando dashboard..." />
<ListLoading isLoading={loading} message="Carregando lista..." />
<TableLoading isLoading={loading} message="Carregando dados..." />
<PageLoading isLoading={loading} message="Carregando página..." />
<StatsLoading isLoading={loading} message="Carregando estatísticas..." />

// Componente genérico
<UnifiedLoading 
  isLoading={loading}
  type="dashboard" // dashboard | list | table | page | stats | custom
  message="Carregando..."
/>
```

#### `LoadingOverlay` - Loading tradicional (legado)
```tsx
import { LoadingOverlay } from '@/components/ui'

<LoadingOverlay 
  isLoading={loading}
  message="Carregando dados..."
  progress={50} // opcional
/>
```

#### `InlineLoader` - Spinner inline
```tsx
import { InlineLoader } from '@/components/ui'

<InlineLoader size="sm" /> // sm | md | lg
```

### 🎭 **Skeleton Components**

#### Skeletons baseados no padrão MikroTik Cards
```tsx
import { 
  SkeletonStatCard,
  SkeletonMediumCard, 
  SkeletonSmallCard,
  SkeletonTable,
  SkeletonList
} from '@/components/ui'

// Cards de estatística
<SkeletonStatCard variant="blue" />
<SkeletonMediumCard variant="green" />
<SkeletonSmallCard variant="purple" />

// Tabelas e listas
<SkeletonTable rows={10} />
<SkeletonList items={8} />
```

### 🔔 **Toast System**

#### Já implementado e funcionando
```tsx
import { useToast } from '@/components/ui'

const { addToast } = useToast()

addToast({
  type: 'success', // success | error | warning | info
  title: 'Sucesso!',
  description: 'Operação realizada com sucesso'
})
```

### 🎛️ **Form Components**

#### `Button` - Botão padronizado
```tsx
import { Button } from '@/components/ui'

<Button
  variant="default" // default | outline | ghost | destructive
  size="md" // sm | md | lg
  disabled={loading}
>
  {loading ? <InlineLoader size="sm" /> : "Texto"}
</Button>
```

#### `Input` - Input padronizado
```tsx
import { Input } from '@/components/ui'

<Input
  placeholder="Digite aqui..."
  className="bg-gray-900 border-gray-800 text-white"
  disabled={loading}
/>
```

#### `Switch` - Toggle switch
```tsx
import { Switch } from '@/components/ui'

<Switch
  checked={isEnabled}
  onCheckedChange={setIsEnabled}
  disabled={updating}
/>
```

## 🎯 **Padrões de Uso**

### ✅ **Boas Práticas**

#### **1. Import de Components**
```tsx
// ✅ Usar import unificado
import { Modal, Button, useToast, useModal } from '@/components/ui'

// ❌ Evitar imports individuais
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
```

#### **2. Estados de Loading**
```tsx
// ✅ Usar componentes padronizados
{loading && <LoadingOverlay isLoading={loading} />}
{processing && <InlineLoader size="sm" />}

// ❌ Evitar spinners customizados
<div className="animate-spin...">
```

#### **3. Confirmações**
```tsx
// ✅ Usar useConfirm
const confirmed = await confirm({
  title: 'Deletar item',
  variant: 'destructive'
})

// ❌ Evitar alert() nativo
if (confirm('Deletar item?')) { }
```

#### **4. Notificações**
```tsx
// ✅ Usar toast system
addToast({
  type: 'success',
  title: 'Sucesso!',
  description: 'Operação realizada'
})

// ❌ Evitar alert() nativo
alert('Operação realizada!')
```

### 🎨 **Design Tokens**

#### **Z-Index Padronizado**
```css
z-50  /* Modals e overlays */
z-40  /* Dropdowns */
z-30  /* Tooltips */
z-20  /* Fixed elements */
z-10  /* Sticky elements */
```

#### **Backdrop Padronizado**
```css
bg-black/80 backdrop-blur-sm  /* Modal overlay */
bg-gray-900/90               /* Card overlay */
```

#### **Animações Padronizadas**
```tsx
// Entrada de modal
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
transition={{ duration: 0.2 }}

// Loading spinner
animate={{ rotate: 360 }}
transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
```

## 🔧 **Customização**

### **Cores por Variante**
```tsx
// Button variants
default:     bg-blue-600 hover:bg-blue-700
outline:     border-gray-800 text-gray-300 hover:text-white
destructive: bg-red-600 hover:bg-red-700

// Toast types
success: border-green-500/30 bg-green-500/10 text-green-400
error:   border-red-500/30 bg-red-500/10 text-red-400
warning: border-yellow-500/30 bg-yellow-500/10 text-yellow-400
info:    border-blue-500/30 bg-blue-500/10 text-blue-400
```

### **Tamanhos Responsivos**
```tsx
// Modal sizes
sm:   max-w-md   (mobile: 90vw)
md:   max-w-lg   (mobile: 90vw)
lg:   max-w-2xl  (mobile: 90vw)
xl:   max-w-4xl  (mobile: 90vw)
full: max-w-7xl  (mobile: 90vw)
```

## 📱 **Responsividade**

Todos os componentes são responsivos por padrão:
- **Mobile**: Layout em coluna, modais em fullscreen
- **Tablet**: Layout adaptado, modais centrados
- **Desktop**: Layout completo, modais com tamanhos fixos

## ♿ **Acessibilidade**

- **ARIA labels** em todos os componentes interativos
- **Focus management** em modais e diálogos
- **Keyboard navigation** suportada
- **Screen reader** compatível
- **Color contrast** adequado

## 🔄 **Migração de Componentes Antigos**

### **Substituições Diretas**

```tsx
// ❌ Antes
import SimpleModal from '@/components/SimpleModal'
<SimpleModal isOpen={open} onClose={setOpen}>

// ✅ Depois  
import { Modal } from '@/components/ui'
<Modal open={open} onOpenChange={setOpen}>

// ❌ Antes
if (confirm('Deletar?')) { }

// ✅ Depois
const confirmed = await confirm({ title: 'Deletar?' })
if (confirmed) { }

// ❌ Antes
alert('Sucesso!')

// ✅ Depois
addToast({ type: 'success', title: 'Sucesso!' })
```

## 🚀 **Performance**

- **Tree shaking** - apenas componentes usados são incluídos
- **Lazy loading** - componentes carregados sob demanda
- **Memoização** - re-renders otimizados
- **Bundle splitting** - código dividido eficientemente

## 📚 **Exemplos Práticos**

### **Modal de Formulário Completo**
```tsx
function EditUserModal({ user, open, onOpenChange }) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data) => {
    setLoading(true)
    try {
      await updateUser(data)
      addToast({
        type: 'success',
        title: 'Usuário atualizado!',
        description: 'As alterações foram salvas'
      })
      onOpenChange(false)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro!',
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Usuário"
      description="Atualize as informações do usuário"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <ModalContent>
          <Input placeholder="Nome" />
          <Input placeholder="Email" />
        </ModalContent>
        
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <InlineLoader size="sm" /> : "Salvar"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
```

### **Lista com Confirmação de Delete**
```tsx
function UsersList() {
  const { confirm, ConfirmComponent } = useConfirm()
  const { addToast } = useToast()

  const handleDelete = async (userId) => {
    const confirmed = await confirm({
      title: 'Deletar usuário',
      description: 'Esta ação não pode ser desfeita',
      variant: 'destructive'
    })

    if (confirmed) {
      try {
        await deleteUser(userId)
        addToast({
          type: 'success',
          title: 'Usuário deletado',
          description: 'O usuário foi removido do sistema'
        })
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Erro ao deletar',
          description: error.message
        })
      }
    }
  }

  return (
    <>
      {users.map(user => (
        <div key={user.id}>
          {user.name}
          <Button 
            variant="destructive" 
            onClick={() => handleDelete(user.id)}
          >
            Deletar
          </Button>
        </div>
      ))}
      
      <ConfirmComponent />
    </>
  )
}
```

---

## ✅ **Sistema Implementado com Sucesso!**

O sistema de componentes UI está totalmente funcional e padronizado. Use este guia como referência para manter a consistência em todo o projeto.

**Benefícios alcançados:**
- ✅ Consistência visual total
- ✅ Código mais limpo e manutenível  
- ✅ Melhor experiência do usuário
- ✅ Performance otimizada
- ✅ Acessibilidade garantida

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>