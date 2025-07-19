/**
 * 📊 System Chart Component
 * 
 * Componente de gráfico avançado para métricas do sistema
 */

import React, { useRef, useEffect } from 'react'

interface SystemChartProps {
  data: number[]
  label: string
  color: string
  type: 'line' | 'area' | 'bar'
  width?: number
  height?: number
  showGrid?: boolean
  animated?: boolean
}

export const SystemChart: React.FC<SystemChartProps> = ({
  data,
  label,
  color,
  type = 'area',
  width = 200,
  height = 80,
  showGrid = true,
  animated = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set pixel ratio for sharp rendering
    const pixelRatio = window.devicePixelRatio || 1
    canvas.width = width * pixelRatio
    canvas.height = height * pixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(pixelRatio, pixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    if (data.length < 2) {
      // Draw "no data" message
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Sem dados suficientes', width / 2, height / 2)
      return
    }

    // Calculate bounds
    const maxValue = Math.max(...data)
    const minValue = Math.min(...data)
    const range = maxValue - minValue || 1
    const padding = 10

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#374151'
      ctx.lineWidth = 0.5
      ctx.setLineDash([2, 2])
      
      // Horizontal lines
      for (let i = 1; i <= 4; i++) {
        const y = (height / 5) * i
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(width - padding, y)
        ctx.stroke()
      }
      
      // Vertical lines
      const stepX = (width - padding * 2) / 4
      for (let i = 1; i <= 4; i++) {
        const x = padding + stepX * i
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, height - padding)
        ctx.stroke()
      }
      
      ctx.setLineDash([])
    }

    // Calculate points
    const points = data.map((value, index) => ({
      x: padding + ((index / (data.length - 1)) * (width - padding * 2)),
      y: height - padding - (((value - minValue) / range) * (height - padding * 2))
    }))

    if (type === 'area' || type === 'line') {
      // Create gradient for area chart
      if (type === 'area') {
        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, color + '60')
        gradient.addColorStop(0.5, color + '30')
        gradient.addColorStop(1, color + '10')

        // Draw area
        ctx.beginPath()
        ctx.moveTo(points[0].x, height - padding)
        points.forEach(point => ctx.lineTo(point.x, point.y))
        ctx.lineTo(points[points.length - 1].x, height - padding)
        ctx.closePath()
        ctx.fillStyle = gradient
        ctx.fill()
      }

      // Draw line
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          // Smooth curve using quadratic bezier
          const prevPoint = points[index - 1]
          const cpX = (prevPoint.x + point.x) / 2
          ctx.quadraticCurveTo(cpX, prevPoint.y, point.x, point.y)
        }
      })
      ctx.stroke()

      // Draw points
      points.forEach((point, index) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, index === points.length - 1 ? 4 : 2, 0, 2 * Math.PI)
        ctx.fillStyle = index === points.length - 1 ? color : color + '80'
        ctx.fill()
        
        // Highlight current point
        if (index === points.length - 1) {
          ctx.beginPath()
          ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI)
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })
    } else if (type === 'bar') {
      // Draw bars
      const barWidth = (width - padding * 2) / data.length * 0.8
      const barSpacing = (width - padding * 2) / data.length * 0.2

      data.forEach((value, index) => {
        const barHeight = ((value - minValue) / range) * (height - padding * 2)
        const x = padding + (index * (barWidth + barSpacing))
        const y = height - padding - barHeight

        // Create gradient for bar
        const gradient = ctx.createLinearGradient(0, y, 0, height - padding)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, color + '60')

        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth, barHeight)
      })
    }

    // Draw value labels
    ctx.fillStyle = '#9ca3af'
    ctx.font = '10px system-ui'
    ctx.textAlign = 'left'
    
    // Min value
    ctx.fillText(minValue.toFixed(1), padding, height - 2)
    
    // Max value
    ctx.textAlign = 'right'
    ctx.fillText(maxValue.toFixed(1), width - padding, 12)
    
    // Current value
    ctx.textAlign = 'center'
    ctx.fillStyle = color
    ctx.font = '12px system-ui'
    const currentValue = data[data.length - 1]
    ctx.fillText(currentValue.toFixed(1), width / 2, height - 2)

  }, [data, color, type, width, height, showGrid])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="rounded-lg"
        style={{ width, height }}
      />
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <span className="text-xs text-gray-500 mt-1">{label}</span>
      </div>
    </div>
  )
}

// Predefined chart configurations
export const CPUChart: React.FC<{ data: number[] }> = ({ data }) => (
  <SystemChart
    data={data}
    label="CPU (%)"
    color="#60a5fa"
    type="area"
    width={150}
    height={60}
  />
)

export const MemoryChart: React.FC<{ data: number[] }> = ({ data }) => (
  <SystemChart
    data={data}
    label="Memória (%)"
    color="#34d399"
    type="area"
    width={150}
    height={60}
  />
)

export const DiskChart: React.FC<{ data: number[] }> = ({ data }) => (
  <SystemChart
    data={data}
    label="Disco (%)"
    color="#fbbf24"
    type="area"
    width={150}
    height={60}
  />
)

export const ActiveUsersChart: React.FC<{ data: number[] }> = ({ data }) => (
  <SystemChart
    data={data}
    label="Usuários Ativos"
    color="#a78bfa"
    type="bar"
    width={150}
    height={60}
  />
)