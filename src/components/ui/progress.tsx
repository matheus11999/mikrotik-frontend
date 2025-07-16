/**
 * Progress Component
 * 
 * Simple progress bar component
 */

import React from 'react'

interface ProgressProps {
  value: number
  max?: number
  className?: string
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`w-full bg-gray-700/30 rounded-full h-2 ${className}`}>
      <div 
        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}