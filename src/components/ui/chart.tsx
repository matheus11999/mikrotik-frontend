import React from 'react'
import { cn } from '../../lib/utils'

interface ChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  title?: string
  className?: string
}

export function SimpleChart({ data, title, className }: ChartProps) {
  const maxValue = Math.max(...data.map(item => item.value))
  
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500'
  ]

  return (
    <div className={cn("bg-black border border-gray-800 rounded-xl p-6", className)}>
      {title && (
        <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      )}
      
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
          const colorClass = item.color || colors[index % colors.length]
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-300">{item.label}</span>
                <span className="text-sm font-bold text-white">
                  {typeof item.value === 'number' && item.value > 1000 
                    ? item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : item.value
                  }
                </span>
              </div>
              
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${colorClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ProgressRingProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  className?: string
}

export function ProgressRing({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8, 
  color = '#22c55e',
  label,
  className 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = max > 0 ? (value / max) * 100 : 0
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{percentage.toFixed(1)}%</span>
          <span className="text-xs text-gray-400 text-center">
            {value.toLocaleString()} / {max.toLocaleString()}
          </span>
        </div>
      </div>
      
      {label && (
        <span className="mt-2 text-sm font-medium text-gray-300 text-center">{label}</span>
      )}
    </div>
  )
} 