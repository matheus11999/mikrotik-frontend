/**
 * 📊 Overview Tab - Visão Geral Melhorada do MikroTik
 * 
 * Nova versão com gráficos, histórico e design responsivo
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Users, 
  Database, 
  Activity,
  Server,
  Info,
  Router,
  Clock,
  TrendingUp,
  BarChart3,
  RefreshCw,
  History
} from 'lucide-react'

// Components
import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { useToast } from '../../ui/toast'

interface OverviewTabProps {
  mikrotikId: string
  mikrotikName: string
  session: any
  baseUrl: string
  headers: Record<string, string>
  onRefresh?: () => void
}

interface SystemResource {
  'architecture-name'?: string
  'board-name'?: string
  'cpu-count'?: string
  'cpu-frequency'?: string
  'cpu-load'?: string
  'free-memory'?: string
  'total-memory'?: string
  'free-hdd-space'?: string
  'total-hdd-space'?: string
  uptime?: string
  version?: string
}

interface RouterBoard {
  model?: string
  'serial-number'?: string
  'firmware-type'?: string
  'current-firmware'?: string
}

interface Identity {
  name?: string
}

interface SystemStats {
  resource?: SystemResource
  routerboard?: RouterBoard
  identity?: Identity
}

interface HotspotStats {
  totalUsers: number
  activeUsers: number
  totalProfiles: number
  totalServers: number
}

interface HistoricalData {
  timestamp: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  activeUsers: number
}

// Custom Chart Component using Canvas
const MiniChart: React.FC<{
  data: number[]
  color: string
  label: string
  width?: number
  height?: number
}> = ({ data, color, label, width = 120, height = 40 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    if (data.length < 2) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Calculate points
    const maxValue = Math.max(...data, 1)
    const minValue = Math.min(...data, 0)
    const range = maxValue - minValue || 1

    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - minValue) / range) * height
    }))

    // Draw gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, color + '40')
    gradient.addColorStop(1, color + '10')

    // Draw area
    ctx.beginPath()
    ctx.moveTo(0, height)
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.lineTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

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
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.stroke()

    // Draw current value point
    const lastPoint = points[points.length - 1]
    ctx.beginPath()
    ctx.arc(lastPoint.x, lastPoint.y, 3, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()

  }, [data, color, width, height])

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded"
      />
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  )
}

// Enhanced Card Component with Chart
const MetricCard: React.FC<{
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle: string
  color: string
  historicalData: number[]
  trend?: 'up' | 'down' | 'stable'
  delay: number
}> = ({ icon, title, value, subtitle, color, historicalData, trend, delay }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-400" />
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />
      default:
        return <BarChart3 className="h-3 w-3 text-gray-400" />
    }
  }

  const borderColor = {
    blue: 'hover:border-blue-500/50',
    green: 'hover:border-green-500/50',
    orange: 'hover:border-orange-500/50',
    purple: 'hover:border-purple-500/50',
    red: 'hover:border-red-500/50',
    yellow: 'hover:border-yellow-500/50'
  }[color] || 'hover:border-gray-500/50'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -2 }}
    >
      <Card className={`bg-black/40 border-gray-800/50 p-6 ${borderColor} transition-all duration-300 hover:shadow-lg hover:shadow-${color}-500/10`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${color}-600/20 rounded-lg`}>
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className={`text-2xl font-bold text-${color}-400`}>
              {value}
            </p>
            <p className="text-sm text-gray-400">{subtitle}</p>
          </div>
          
          {historicalData.length > 1 && (
            <div className="flex justify-center">
              <MiniChart
                data={historicalData}
                color={`var(--${color}-400, #60a5fa)`}
                label="Últimas 15 leituras"
                width={100}
                height={30}
              />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

const OverviewTabImproved: React.FC<OverviewTabProps> = ({
  mikrotikId,
  mikrotikName,
  session,
  baseUrl,
  headers,
  onRefresh
}) => {
  const { addToast } = useToast()

  // States
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [hotspotStats, setHotspotStats] = useState<HotspotStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Storage key
  const storageKey = `mikrotik_history_${mikrotikId}`

  // Load historical data from localStorage
  const loadHistoricalData = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data = JSON.parse(stored) as HistoricalData[]
        setHistoricalData(data)
      }
    } catch (error) {
      console.error('Error loading historical data:', error)
    }
  }, [storageKey])

  // Save historical data to localStorage
  const saveHistoricalData = useCallback((data: HistoricalData[]) => {
    try {
      // Keep only last 15 records
      const limitedData = data.slice(-15)
      localStorage.setItem(storageKey, JSON.stringify(limitedData))
      setHistoricalData(limitedData)
    } catch (error) {
      console.error('Error saving historical data:', error)
    }
  }, [storageKey])

  // Add new data point
  const addDataPoint = useCallback((stats: SystemStats, hotspot: HotspotStats) => {
    const memoryUsage = getMemoryUsagePercent(stats?.resource)
    const diskUsage = getDiskUsagePercent(stats?.resource)
    const cpuUsage = parseFloat(stats?.resource?.['cpu-load']?.replace('%', '') || '0')

    const newPoint: HistoricalData = {
      timestamp: Date.now(),
      cpuUsage,
      memoryUsage,
      diskUsage,
      activeUsers: hotspot.activeUsers
    }

    setHistoricalData(prev => {
      const updated = [...prev, newPoint].slice(-15) // Keep only last 15
      saveHistoricalData(updated)
      return updated
    })
  }, [saveHistoricalData])

  // Fetch system resource info
  const fetchSystemStats = useCallback(async () => {
    if (!mikrotikId || !baseUrl) return

    try {
      console.log('[OverviewTab] Fetching system stats for MikroTik:', mikrotikId)
      
      const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/system/resource`, {
        headers
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[OverviewTab] System stats response:', data)
      
      const statsData = data.success && data.data ? data.data : data
      return { resource: statsData }
      
    } catch (error) {
      console.error('[OverviewTab] Error fetching system stats:', error)
      setError('Erro ao carregar estatísticas do sistema')
      throw error
    }
  }, [mikrotikId, baseUrl, headers])

  // Fetch hotspot statistics
  const fetchHotspotStats = useCallback(async () => {
    if (!mikrotikId || !baseUrl) return

    try {
      console.log('[OverviewTab] Fetching hotspot stats for MikroTik:', mikrotikId)
      
      // Fetch users
      const usersResponse = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user`, {
        headers
      })
      
      // Fetch active users
      const activeUsersResponse = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/active`, {
        headers
      })
      
      // Fetch profiles
      const profilesResponse = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user/profile`, {
        headers
      })
      
      // Fetch servers
      const serversResponse = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot`, {
        headers
      })

      const [usersData, activeUsersData, profilesData, serversData] = await Promise.all([
        usersResponse.ok ? usersResponse.json() : { data: [] },
        activeUsersResponse.ok ? activeUsersResponse.json() : { data: [] },
        profilesResponse.ok ? profilesResponse.json() : { data: [] },
        serversResponse.ok ? serversResponse.json() : { data: [] }
      ])

      const stats: HotspotStats = {
        totalUsers: (usersData.success ? usersData.data : usersData)?.length || 0,
        activeUsers: (activeUsersData.success ? activeUsersData.data : activeUsersData)?.length || 0,
        totalProfiles: (profilesData.success ? profilesData.data : profilesData)?.length || 0,
        totalServers: (serversData.success ? serversData.data : serversData)?.length || 0
      }

      console.log('[OverviewTab] Hotspot stats:', stats)
      return stats
      
    } catch (error) {
      console.error('[OverviewTab] Error fetching hotspot stats:', error)
      throw error
    }
  }, [mikrotikId, baseUrl, headers])

  // Load data
  const loadData = useCallback(async () => {
    if (!mikrotikId || !baseUrl || !session) return

    setLoading(true)
    setError(null)
    
    try {
      const [systemData, hotspotData] = await Promise.all([
        fetchSystemStats(),
        fetchHotspotStats()
      ])

      if (systemData && hotspotData) {
        setSystemStats(systemData)
        setHotspotStats(hotspotData)
        setLastUpdate(new Date())
        
        // Add to historical data
        addDataPoint(systemData, hotspotData)
        
        addToast({
          title: 'Dados atualizados',
          description: 'Estatísticas do MikroTik foram atualizadas com sucesso',
          type: 'success'
        })
      }
    } catch (error) {
      console.error('[OverviewTab] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [mikrotikId, baseUrl, session, fetchSystemStats, fetchHotspotStats, addDataPoint, addToast])

  // Load data on mount
  useEffect(() => {
    loadHistoricalData()
    loadData()
  }, [loadHistoricalData, loadData])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, loadData])

  // Format bytes
  const formatBytes = (bytes: string | number): string => {
    if (!bytes) return '0 B'
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes
    if (numBytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(numBytes) / Math.log(k))

    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format uptime
  const formatUptime = (uptime: string): string => {
    if (!uptime) return 'N/A'
    
    const matches = uptime.match(/(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/)
    if (!matches) return uptime

    const [, weeks, days, hours, minutes, seconds] = matches
    const parts = []

    if (weeks) parts.push(`${weeks}s`)
    if (days) parts.push(`${days}d`)
    if (hours) parts.push(`${hours}h`)
    if (minutes) parts.push(`${minutes}m`)

    return parts.join(' ') || uptime
  }

  // Calculate memory usage percentage
  const getMemoryUsagePercent = (resource?: SystemResource): number => {
    if (!resource) return 0
    
    const total = parseInt(resource['total-memory'] || '0')
    const free = parseInt(resource['free-memory'] || '0')
    
    if (total === 0) return 0
    return Math.round(((total - free) / total) * 100)
  }

  // Calculate disk usage percentage
  const getDiskUsagePercent = (resource?: SystemResource): number => {
    if (!resource) return 0
    
    const total = parseInt(resource['total-hdd-space'] || '0')
    const free = parseInt(resource['free-hdd-space'] || '0')
    
    if (total === 0) return 0
    return Math.round(((total - free) / total) * 100)
  }

  // Get trend
  const getTrend = (data: number[]): 'up' | 'down' | 'stable' => {
    if (data.length < 2) return 'stable'
    const recent = data.slice(-3)
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length
    const current = data[data.length - 1]
    
    if (current > avg + 2) return 'up'
    if (current < avg - 2) return 'down'
    return 'stable'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Enhanced Loading skeleton with pulse animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-black/40 border-gray-800/50 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700/30 rounded-lg"></div>
                  <div className="h-6 bg-gray-700/30 rounded w-24"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-8 bg-gray-700/30 rounded w-16"></div>
                  <div className="h-4 bg-gray-700/30 rounded w-20"></div>
                  <div className="h-8 bg-gray-700/30 rounded w-full"></div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // Prepare chart data
  const cpuData = historicalData.map(d => d.cpuUsage)
  const memoryData = historicalData.map(d => d.memoryUsage)
  const diskData = historicalData.map(d => d.diskUsage)
  const activeUsersData = historicalData.map(d => d.activeUsers)

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Visão Geral do Sistema</h2>
          {lastUpdate && (
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Badge
            variant={historicalData.length > 0 ? 'success' : 'secondary'}
            className="flex items-center gap-2"
          >
            <History className="h-3 w-3" />
            {historicalData.length} registros
          </Badge>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
            }`}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </motion.div>

      {/* System Metrics Cards with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<Cpu className="h-5 w-5 text-blue-400" />}
          title="CPU"
          value={systemStats?.resource?.['cpu-load'] || '0%'}
          subtitle="Uso atual"
          color="blue"
          historicalData={cpuData}
          trend={getTrend(cpuData)}
          delay={0.1}
        />

        <MetricCard
          icon={<MemoryStick className="h-5 w-5 text-green-400" />}
          title="Memória"
          value={`${getMemoryUsagePercent(systemStats?.resource)}%`}
          subtitle={`${formatBytes(systemStats?.resource?.['free-memory'] || 0)} livre`}
          color="green"
          historicalData={memoryData}
          trend={getTrend(memoryData)}
          delay={0.2}
        />

        <MetricCard
          icon={<HardDrive className="h-5 w-5 text-orange-400" />}
          title="Disco"
          value={`${getDiskUsagePercent(systemStats?.resource)}%`}
          subtitle={`${formatBytes(systemStats?.resource?.['free-hdd-space'] || 0)} livre`}
          color="orange"
          historicalData={diskData}
          trend={getTrend(diskData)}
          delay={0.3}
        />

        <MetricCard
          icon={<Clock className="h-5 w-5 text-purple-400" />}
          title="Uptime"
          value={formatUptime(systemStats?.resource?.uptime || '')}
          subtitle="Tempo ativo"
          color="purple"
          historicalData={[]}
          delay={0.4}
        />
      </div>

      {/* Hotspot Statistics with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<Users className="h-5 w-5 text-blue-400" />}
          title="Usuários Total"
          value={hotspotStats?.totalUsers || 0}
          subtitle="Usuários hotspot"
          color="blue"
          historicalData={[]}
          delay={0.5}
        />

        <MetricCard
          icon={<Activity className="h-5 w-5 text-green-400" />}
          title="Usuários Ativos"
          value={hotspotStats?.activeUsers || 0}
          subtitle="Conectados agora"
          color="green"
          historicalData={activeUsersData}
          trend={getTrend(activeUsersData)}
          delay={0.6}
        />

        <MetricCard
          icon={<Database className="h-5 w-5 text-orange-400" />}
          title="Planos Total"
          value={hotspotStats?.totalProfiles || 0}
          subtitle="User profiles"
          color="orange"
          historicalData={[]}
          delay={0.7}
        />

        <MetricCard
          icon={<Server className="h-5 w-5 text-purple-400" />}
          title="Servidores"
          value={hotspotStats?.totalServers || 0}
          subtitle="Hotspot servers"
          color="purple"
          historicalData={[]}
          delay={0.8}
        />
      </div>

      {/* System Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-gray-700/50 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-600/20 rounded-lg">
              <Info className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Informações do Sistema</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">Arquitetura</h4>
              <p className="text-white font-medium">{systemStats?.resource?.['architecture-name'] || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">RouterBoard</h4>
              <p className="text-white font-medium">{systemStats?.resource?.['board-name'] || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">Versão</h4>
              <p className="text-white font-medium">{systemStats?.resource?.version || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">CPU</h4>
              <p className="text-white font-medium">
                {systemStats?.resource?.['cpu-count']} cores @ {systemStats?.resource?.['cpu-frequency']}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-600/10 border border-red-600/30 rounded-lg p-4"
        >
          <p className="text-red-300 flex items-center gap-2">
            <Info className="h-4 w-4" />
            {error}
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default OverviewTabImproved