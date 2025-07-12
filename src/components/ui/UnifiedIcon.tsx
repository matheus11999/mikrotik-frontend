import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface UnifiedIconProps {
  icon: LucideIcon
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan' | 'yellow' | 'emerald'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'container' | 'simple'
  className?: string
}

const UnifiedIcon: React.FC<UnifiedIconProps> = ({
  icon: Icon,
  color = 'blue',
  size = 'md',
  variant = 'container',
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    cyan: 'text-cyan-400',
    yellow: 'text-yellow-400',
    emerald: 'text-emerald-400'
  }

  const containerColorClasses = {
    blue: 'mikropix-icon-blue',
    green: 'mikropix-icon-green',
    orange: 'mikropix-icon-orange',
    purple: 'mikropix-icon-purple',
    red: 'mikropix-icon-red',
    cyan: 'mikropix-icon-cyan',
    yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20'
  }

  if (variant === 'simple') {
    return (
      <Icon className={cn(sizeClasses[size], colorClasses[color], className)} />
    )
  }

  return (
    <div className={cn('mikropix-icon-container', containerColorClasses[color])}>
      <Icon className={cn(sizeClasses[size], colorClasses[color], className)} />
    </div>
  )
}

export default UnifiedIcon