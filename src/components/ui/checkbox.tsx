/**
 * Checkbox Component
 * 
 * Simple checkbox component
 */

import React from 'react'

interface CheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  id?: string
  disabled?: boolean
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  className = '',
  id,
  disabled = false
}) => {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
      className={`w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 ${className}`}
    />
  )
}