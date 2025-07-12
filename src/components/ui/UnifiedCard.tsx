import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface UnifiedCardProps {
  children: React.ReactNode
  variant?: 'default' | 'landing' | 'stats' | 'glass'
  hover?: boolean
  animation?: boolean
  gradient?: boolean
  className?: string
  onClick?: () => void
}

const UnifiedCard: React.FC<UnifiedCardProps> = ({
  children,
  variant = 'default',
  hover = true,
  animation = true,
  gradient = false,
  className,
  onClick
}) => {
  const variants = {
    default: 'mikropix-card mikropix-spacing-card',
    landing: 'bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6',
    stats: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-4',
    glass: 'mikropix-glass-effect rounded-2xl p-6'
  }

  const hoverClasses = hover ? 'mikropix-card-hover cursor-pointer' : ''
  const gradientClasses = gradient ? 'bg-gradient-to-br' : ''

  const cardClasses = cn(
    variants[variant],
    hoverClasses,
    gradientClasses,
    className
  )

  const cardContent = (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  )

  if (animation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={hover ? { y: -2 } : {}}
      >
        {cardContent}
      </motion.div>
    )
  }

  return cardContent
}

export default UnifiedCard