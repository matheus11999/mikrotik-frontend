import React from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface UnifiedButtonProps {
  children: React.ReactNode
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

const UnifiedButton: React.FC<UnifiedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  animation = true,
  className,
  onClick,
  type = 'button'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = {
    primary: 'mikropix-button-primary',
    secondary: 'mikropix-button-secondary',
    outline: 'border border-gray-600 text-white hover:bg-gray-800/50 bg-transparent',
    ghost: 'text-white hover:bg-gray-800/30 bg-transparent',
    destructive: 'bg-red-500 hover:bg-red-600 text-white border border-red-500'
  }

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
  const loadingClasses = loading ? 'opacity-75 cursor-wait' : ''

  const buttonClasses = cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-400/20',
    sizeClasses[size],
    variantClasses[variant],
    disabledClasses,
    loadingClasses,
    className
  )

  const iconClasses = cn(
    'h-4 w-4',
    iconPosition === 'left' ? 'mr-2' : 'ml-2'
  )

  const buttonContent = (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
          Carregando...
        </div>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className={iconClasses} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className={iconClasses} />}
        </>
      )}
    </button>
  )

  if (animation && !disabled && !loading) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {buttonContent}
      </motion.div>
    )
  }

  return buttonContent
}

export default UnifiedButton