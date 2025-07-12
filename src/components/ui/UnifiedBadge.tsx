import React from 'react'
import { cn } from '../../lib/utils'

interface UnifiedBadgeProps {
  children: React.ReactNode
  variant?: 'online' | 'offline' | 'warning' | 'info' | 'success' | 'error'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const UnifiedBadge: React.FC<UnifiedBadgeProps> = ({
  children,
  variant = 'info',
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const variantClasses = {
    online: 'mikropix-status-online',
    offline: 'mikropix-status-offline',
    warning: 'mikropix-status-warning',
    info: 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
    success: 'text-green-400 bg-green-500/10 border border-green-500/20',
    error: 'text-red-400 bg-red-500/10 border border-red-500/20'
  }

  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export default UnifiedBadge