import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface UnifiedCardProps {
  children: ReactNode
  variant?: 'default' | 'landing' | 'stats' | 'glass'
  hover?: boolean
  animation?: boolean
  gradient?: boolean
  className?: string
  onClick?: () => void
}

export interface UnifiedIconProps {
  icon: LucideIcon
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan' | 'yellow' | 'emerald'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'container' | 'simple'
  className?: string
}

export interface UnifiedBadgeProps {
  children: ReactNode
  variant?: 'online' | 'offline' | 'warning' | 'info' | 'success' | 'error'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface UnifiedTypographyProps {
  children: ReactNode
  variant?: 'hero' | 'title' | 'heading' | 'body' | 'small' | 'caption'
  gradient?: boolean
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
}

export interface UnifiedButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  animation?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}