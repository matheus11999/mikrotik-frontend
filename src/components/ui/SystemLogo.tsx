import React, { useState } from 'react'
import { Wifi } from 'lucide-react'
import { useSystemSettings } from '../../contexts/SystemSettingsContext'

interface SystemLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SystemLogo({ size = 'md', className = '' }: SystemLogoProps) {
  const { settings } = useSystemSettings()
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  }

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  // Verificar se devemos usar a imagem personalizada (sempre preferir URLs do Supabase)
  const hasCustomLogo = settings.logo_url && 
    settings.logo_url !== '' && 
    !settings.logo_url.includes('undefined') &&
    !imageError

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className={`${sizeClasses[size]} rounded-xl flex items-center justify-center overflow-hidden ${className}`}>
      {hasCustomLogo ? (
        <img
          src={settings.logo_url}
          alt={settings.site_name}
          className={`${sizeClasses[size]} object-contain`}
          onError={handleImageError}
        />
      ) : (
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
          <Wifi className={`${iconSizeClasses[size]} text-blue-400`} />
        </div>
      )}
    </div>
  )
}