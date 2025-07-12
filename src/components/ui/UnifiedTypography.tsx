import React from 'react'
import { cn } from '../../lib/utils'

interface UnifiedTypographyProps {
  children: React.ReactNode
  variant?: 'hero' | 'title' | 'heading' | 'body' | 'small' | 'caption'
  gradient?: boolean
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
}

const UnifiedTypography: React.FC<UnifiedTypographyProps> = ({
  children,
  variant = 'body',
  gradient = false,
  className,
  as
}) => {
  const variantClasses = {
    hero: 'mikropix-text-hero',
    title: 'mikropix-text-title',
    heading: 'mikropix-text-heading',
    body: 'text-sm font-medium',
    small: 'text-xs',
    caption: 'text-xs text-gray-400'
  }

  const defaultElements = {
    hero: 'h1',
    title: 'h2',
    heading: 'h3',
    body: 'p',
    small: 'span',
    caption: 'span'
  } as const

  const Element = as || defaultElements[variant]
  const gradientClasses = gradient ? 'mikropix-text-gradient' : ''

  return React.createElement(
    Element,
    {
      className: cn(
        variantClasses[variant],
        gradientClasses,
        className
      )
    },
    children
  )
}

export default UnifiedTypography