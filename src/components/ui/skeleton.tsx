import { cn } from "../../lib/utils"

interface SkeletonProps {
  className?: string
}

// Skeleton base
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-gray-700 rounded animate-pulse", className)} />
  )
}

// Skeleton para ícones
export function SkeletonIcon({ 
  className, 
  variant = "blue" 
}: SkeletonProps & { 
  variant?: "blue" | "green" | "purple" | "orange" | "red" | "yellow" 
}) {
  const variantClasses = {
    blue: "bg-blue-600/20",
    green: "bg-green-600/20", 
    purple: "bg-purple-600/20",
    orange: "bg-orange-600/20",
    red: "bg-red-600/20",
    yellow: "bg-yellow-600/20"
  }

  return (
    <div className={cn("p-2 rounded-lg animate-pulse", variantClasses[variant], className)}>
      <Skeleton className="h-5 w-5" />
    </div>
  )
}

// Skeleton para cards
export function SkeletonCard({ 
  className,
  children
}: SkeletonProps & { children?: React.ReactNode }) {
  return (
    <div className={cn(
      "bg-black border border-gray-800 rounded-xl p-4 sm:p-6 shadow-lg",
      className
    )}>
      {children}
    </div>
  )
}

// Skeleton para estatística grande
export function SkeletonStatCard({ variant = "blue" }: { variant?: "blue" | "green" | "purple" | "orange" | "red" | "yellow" }) {
  return (
    <SkeletonCard>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonIcon variant={variant} />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="w-16 h-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </SkeletonCard>
  )
}

// Skeleton para card médio
export function SkeletonMediumCard({ variant = "green" }: { variant?: "blue" | "green" | "purple" | "orange" | "red" | "yellow" }) {
  return (
    <SkeletonCard>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonIcon variant={variant} />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-16 mb-2" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="w-16 h-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    </SkeletonCard>
  )
}

// Skeleton para card pequeno
export function SkeletonSmallCard({ variant = "purple" }: { variant?: "blue" | "green" | "purple" | "orange" | "red" | "yellow" }) {
  return (
    <SkeletonCard className="p-4">
      <div className="flex items-center gap-3">
        <SkeletonIcon variant={variant} />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-8 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </SkeletonCard>
  )
}

// Skeleton para tabela/lista
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonCard>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <SkeletonIcon variant="blue" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        {/* Rows */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 border border-gray-800 rounded-lg">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full max-w-xs" />
                <Skeleton className="h-3 w-full max-w-sm" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonCard>
  )
}

// Skeleton para header de página
export function SkeletonPageHeader() {
  return (
    <div className="border-b border-gray-800 bg-black">
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <SkeletonIcon variant="blue" className="p-3" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton para dashboard completo
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <SkeletonPageHeader />
      
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonStatCard variant="blue" />
            <SkeletonMediumCard variant="green" />
            <SkeletonSmallCard variant="purple" />
            <SkeletonSmallCard variant="orange" />
          </div>

          {/* Content Cards */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonTable rows={6} />
            <div className="space-y-4">
              <SkeletonMediumCard variant="red" />
              <SkeletonMediumCard variant="yellow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton para lista
export function SkeletonList({ items = 8 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i}>
          <div className="flex items-center gap-4">
            <SkeletonIcon variant={["blue", "green", "purple", "orange"][i % 4] as any} />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-full max-w-md" />
              <Skeleton className="h-4 w-full max-w-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  )
}