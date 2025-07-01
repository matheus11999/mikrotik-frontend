import { motion, AnimatePresence } from "framer-motion"
import { 
  SkeletonDashboard,
  SkeletonList,
  SkeletonTable,
  SkeletonPageHeader,
  SkeletonStatCard,
  SkeletonMediumCard,
  SkeletonSmallCard
} from "./skeleton"

interface UnifiedLoadingProps {
  isLoading: boolean
  type?: "dashboard" | "list" | "table" | "page" | "stats" | "custom"
  message?: string
  children?: React.ReactNode
}

// Loading screen unificado baseado no padrão dos cards MikroTik
export function UnifiedLoading({ 
  isLoading, 
  type = "dashboard", 
  message,
  children 
}: UnifiedLoadingProps) {
  
  const renderLoadingContent = () => {
    switch (type) {
      case "dashboard":
        return <SkeletonDashboard />
      
      case "list":
        return (
          <div className="space-y-6">
            <SkeletonPageHeader />
            <div className="p-4 sm:p-6">
              <div className="max-w-7xl mx-auto">
                <SkeletonList items={8} />
              </div>
            </div>
          </div>
        )
      
      case "table":
        return (
          <div className="space-y-6">
            <SkeletonPageHeader />
            <div className="p-4 sm:p-6">
              <div className="max-w-7xl mx-auto">
                <SkeletonTable rows={10} />
              </div>
            </div>
          </div>
        )
      
      case "page":
        return (
          <div className="space-y-6">
            <SkeletonPageHeader />
            <div className="p-4 sm:p-6">
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <SkeletonMediumCard variant="blue" />
                  <SkeletonMediumCard variant="green" />
                  <SkeletonMediumCard variant="purple" />
                </div>
                <SkeletonList items={5} />
              </div>
            </div>
          </div>
        )
      
      case "stats":
        return (
          <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <SkeletonStatCard variant="blue" />
                <SkeletonStatCard variant="green" />
                <SkeletonStatCard variant="purple" />
                <SkeletonStatCard variant="orange" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <SkeletonTable rows={6} />
                <div className="space-y-4">
                  <SkeletonSmallCard variant="red" />
                  <SkeletonSmallCard variant="yellow" />
                  <SkeletonMediumCard variant="blue" />
                </div>
              </div>
            </div>
          </div>
        )
      
      case "custom":
        return children || <SkeletonDashboard />
      
      default:
        return <SkeletonDashboard />
    }
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black"
        >
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-black/90 backdrop-blur-sm border border-gray-800 rounded-lg px-4 py-2">
                <p className="text-gray-400 text-sm">{message}</p>
              </div>
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {renderLoadingContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook para usar loading unificado
export function useUnifiedLoading(defaultType: UnifiedLoadingProps['type'] = 'dashboard') {
  return {
    LoadingComponent: ({ isLoading, type = defaultType, message, children }: UnifiedLoadingProps) => (
      <UnifiedLoading 
        isLoading={isLoading} 
        type={type} 
        message={message}
        children={children}
      />
    )
  }
}

// Componentes específicos para casos comuns
export function DashboardLoading({ isLoading, message }: { isLoading: boolean, message?: string }) {
  return <UnifiedLoading isLoading={isLoading} type="dashboard" message={message} />
}

export function ListLoading({ isLoading, message }: { isLoading: boolean, message?: string }) {
  return <UnifiedLoading isLoading={isLoading} type="list" message={message} />
}

export function TableLoading({ isLoading, message }: { isLoading: boolean, message?: string }) {
  return <UnifiedLoading isLoading={isLoading} type="table" message={message} />
}

export function PageLoading({ isLoading, message }: { isLoading: boolean, message?: string }) {
  return <UnifiedLoading isLoading={isLoading} type="page" message={message} />
}

export function StatsLoading({ isLoading, message }: { isLoading: boolean, message?: string }) {
  return <UnifiedLoading isLoading={isLoading} type="stats" message={message} />
}