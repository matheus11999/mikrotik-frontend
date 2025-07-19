/**
 * 📊 Overview Tab - Versão Final Melhorada
 * 
 * Dashboard completo com gráficos, localStorage e design responsivo
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Users, 
  Database, 
  Activity,
  Server,
  Info,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  History,
  BarChart3,
  Zap,
  Wifi,
  Shield
} from 'lucide-react'

// Components
import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { useToast } from '../../ui/toast'
import { CPUChart, MemoryChart, DiskChart, ActiveUsersChart } from '../charts/SystemChart'

// Styles
import './overview-styles.css'

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

interface SystemStats {
  resource?: SystemResource
}

// Enhanced Metric Card Component
const EnhancedMetricCard: React.FC<{
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow'
  chartData?: number[]
  ChartComponent?: React.ComponentType<{ data: number[] }>
  trend?: 'up' | 'down' | 'stable'
  delay: number
  onClick?: () => void
}> = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color, 
  chartData = [], 
  ChartComponent,
  trend = 'stable',
  delay,
  onClick 
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-400 trend-up" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400 trend-down" />
      default:
        return <Minus className="h-4 w-4 text-gray-400 trend-stable" />
    }
  }

  const colorClasses = {
    blue: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
    green: 'hover:border-green-500/50 hover:shadow-green-500/10',
    orange: 'hover:border-orange-500/50 hover:shadow-orange-500/10',
    purple: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
    red: 'hover:border-red-500/50 hover:shadow-red-500/10',
    yellow: 'hover:border-yellow-500/50 hover:shadow-yellow-500/10'
  }

  const textColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400'
  }

  const bgColors = {
    blue: 'bg-blue-600/20',
    green: 'bg-green-600/20',
    orange: 'bg-orange-600/20',
    purple: 'bg-purple-600/20',
    red: 'bg-red-600/20',
    yellow: 'bg-yellow-600/20'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`
          metric-card metric-card-${color}
          bg-black/40 border-gray-800/50 p-6 
          ${colorClasses[color]} 
          transition-all duration-300 cursor-pointer
          backdrop-blur-sm
        `}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className={`p-3 ${bgColors[color]} rounded-xl`}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {icon}
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-xs text-gray-500">Tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            {chartData.length > 1 && (
              <BarChart3 className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <motion.p 
                className={`text-3xl font-bold ${textColors[color]}`}
                key={value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {value}
              </motion.p>
              <p className="text-sm text-gray-400">{subtitle}</p>
            </div>
            
            {ChartComponent && chartData.length > 1 && (
              <div className="chart-container">
                <ChartComponent data={chartData} />
              </div>
            )}
          </div>
          
          {chartData.length > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Min: {Math.min(...chartData).toFixed(1)}</span>
              <span>Máx: {Math.max(...chartData).toFixed(1)}</span>
              <span>Méd: {(chartData.reduce((a, b) => a + b, 0) / chartData.length).toFixed(1)}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

const OverviewTabFinal: React.FC<OverviewTabProps> = ({
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
  const [refreshing, setRefreshing] = useState(false)

  // Storage key
  const storageKey = `mikrotik_history_${mikrotikId}`

  // Load historical data from localStorage
  const loadHistoricalData = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data = JSON.parse(stored) as HistoricalData[]
        // Filter data from last 24 hours only
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
        const recentData = data.filter(d => d.timestamp > oneDayAgo)
        setHistoricalData(recentData)
      }
    } catch (error) {
      console.error('Error loading historical data:', error)
    }
  }, [storageKey])

  // Save historical data to localStorage
  const saveHistoricalData = useCallback((data: HistoricalData[]) => {
    try {
      // Keep only last 15 records and last 24 hours
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
      const recentData = data
        .filter(d => d.timestamp > oneDayAgo)
        .slice(-15)
      
      localStorage.setItem(storageKey, JSON.stringify(recentData))
      setHistoricalData(recentData)
    } catch (error) {
      console.error('Error saving historical data:', error)
    }
  }, [storageKey])

  // Calculate percentage functions
  const getMemoryUsagePercent = useCallback((resource?: SystemResource): number => {
    if (!resource) return 0
    const total = parseInt(resource['total-memory'] || '0')
    const free = parseInt(resource['free-memory'] || '0')
    if (total === 0) return 0
    return Math.round(((total - free) / total) * 100)
  }, [])

  const getDiskUsagePercent = useCallback((resource?: SystemResource): number => {
    if (!resource) return 0
    const total = parseInt(resource['total-hdd-space'] || '0')
    const free = parseInt(resource['free-hdd-space'] || '0')
    if (total === 0) return 0
    return Math.round(((total - free) / total) * 100)
  }, [])

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
      const updated = [...prev, newPoint]
      saveHistoricalData(updated)
      return updated.slice(-15)
    })
  }, [getMemoryUsagePercent, getDiskUsagePercent, saveHistoricalData])

  // Fetch functions
  const fetchSystemStats = useCallback(async () => {
    if (!mikrotikId || !baseUrl) return null

    const response = await fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/system/resource`, {
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    const statsData = data.success && data.data ? data.data : data
    return { resource: statsData }
  }, [mikrotikId, baseUrl, headers])

  const fetchHotspotStats = useCallback(async () => {
    if (!mikrotikId || !baseUrl) return null

    const [usersResponse, activeUsersResponse, profilesResponse, serversResponse] = await Promise.all([
      fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user`, { headers }),
      fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/active`, { headers }),
      fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot/user/profile`, { headers }),
      fetch(`${baseUrl}/api/mikrotik/${mikrotikId}/rest/ip/hotspot`, { headers })
    ])

    const [usersData, activeUsersData, profilesData, serversData] = await Promise.all([
      usersResponse.ok ? usersResponse.json() : { data: [] },
      activeUsersResponse.ok ? activeUsersResponse.json() : { data: [] },
      profilesResponse.ok ? profilesResponse.json() : { data: [] },
      serversResponse.ok ? serversResponse.json() : { data: [] }
    ])

    return {
      totalUsers: (usersData.success ? usersData.data : usersData)?.length || 0,
      activeUsers: (activeUsersData.success ? activeUsersData.data : activeUsersData)?.length || 0,
      totalProfiles: (profilesData.success ? profilesData.data : profilesData)?.length || 0,
      totalServers: (serversData.success ? serversData.data : serversData)?.length || 0
    }
  }, [mikrotikId, baseUrl, headers])

  // Load data
  const loadData = useCallback(async (showRefreshingState = false) => {
    if (!mikrotikId || !baseUrl || !session) return

    if (showRefreshingState) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
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
        
        if (showRefreshingState) {
          addToast({
            title: 'Dados atualizados',
            description: 'Estatísticas atualizadas com sucesso',
            type: 'success'
          })
        }
      }
    } catch (error) {
      console.error('[OverviewTab] Error loading data:', error)
      setError('Erro ao carregar dados do MikroTik')
      addToast({
        title: 'Erro ao atualizar',
        description: 'Falha ao carregar dados do MikroTik',
        type: 'error'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
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
      loadData(true)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, loadData])

  // Memoized chart data
  const chartData = useMemo(() => ({
    cpu: historicalData.map(d => d.cpuUsage),
    memory: historicalData.map(d => d.memoryUsage),
    disk: historicalData.map(d => d.diskUsage),
    activeUsers: historicalData.map(d => d.activeUsers)
  }), [historicalData])

  // Trend calculation
  const getTrend = useCallback((data: number[]): 'up' | 'down' | 'stable' => {
    if (data.length < 3) return 'stable'
    const recent = data.slice(-3)
    const trend = recent[2] - recent[0]
    if (trend > 2) return 'up'
    if (trend < -2) return 'down'
    return 'stable'
  }, [])

  // Format functions
  const formatBytes = useCallback((bytes: string | number): string => {
    if (!bytes) return '0 B'
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes
    if (numBytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(numBytes) / Math.log(k))

    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const formatUptime = useCallback((uptime: string): string => {
    if (!uptime) return 'N/A'
    
    const matches = uptime.match(/(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/)
    if (!matches) return uptime

    const [, weeks, days, hours, minutes] = matches
    const parts = []

    if (weeks) parts.push(`${weeks}s`)
    if (days) parts.push(`${days}d`)
    if (hours) parts.push(`${hours}h`)
    if (minutes) parts.push(`${minutes}m`)

    return parts.join(' ') || uptime
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-black/40 border-gray-800/50 p-6 loading-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-700/30 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-700/30 rounded w-24"></div>
                    <div className="h-3 bg-gray-700/30 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-8 bg-gray-700/30 rounded w-20"></div>
                  <div className="h-4 bg-gray-700/30 rounded w-32"></div>
                  <div className="h-16 bg-gray-700/30 rounded w-full"></div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with enhanced controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-400" />
            Visão Geral do Sistema
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {lastUpdate && (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Atualizado às {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              {mikrotikName}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Badge
            variant={historicalData.length > 5 ? 'success' : 'secondary'}
            className="status-badge status-badge-success flex items-center gap-2"
          >
            <History className="h-3 w-3" />
            {historicalData.length} registros
          </Badge>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`auto-refresh-button px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              autoRefresh ? 'active' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30'
            }`}
          >
            <Shield className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          
          <motion.button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-6 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </motion.button>
        </div>
      </motion.div>

      {/* System Performance Cards */}
      <div>
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-semibold text-white mb-6 flex items-center gap-2"
        >
          <BarChart3 className="h-5 w-5 text-blue-400" />
          Performance do Sistema
        </motion.h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedMetricCard
            icon={<Cpu className="h-6 w-6 text-blue-400" />}
            title="CPU"
            value={systemStats?.resource?.['cpu-load'] || '0%'}
            subtitle={`${systemStats?.resource?.['cpu-count'] || 'N/A'} cores @ ${systemStats?.resource?.['cpu-frequency'] || 'N/A'}`}
            color="blue"
            chartData={chartData.cpu}
            ChartComponent={CPUChart}
            trend={getTrend(chartData.cpu)}
            delay={0.1}
          />

          <EnhancedMetricCard
            icon={<MemoryStick className="h-6 w-6 text-green-400" />}
            title="Memória"
            value={`${getMemoryUsagePercent(systemStats?.resource)}%`}
            subtitle={`${formatBytes(systemStats?.resource?.['free-memory'] || 0)} livre de ${formatBytes(systemStats?.resource?.['total-memory'] || 0)}`}
            color="green"
            chartData={chartData.memory}
            ChartComponent={MemoryChart}
            trend={getTrend(chartData.memory)}
            delay={0.2}
          />

          <EnhancedMetricCard
            icon={<HardDrive className="h-6 w-6 text-orange-400" />}
            title="Disco"
            value={`${getDiskUsagePercent(systemStats?.resource)}%`}
            subtitle={`${formatBytes(systemStats?.resource?.['free-hdd-space'] || 0)} livre de ${formatBytes(systemStats?.resource?.['total-hdd-space'] || 0)}`}
            color="orange"
            chartData={chartData.disk}
            ChartComponent={DiskChart}
            trend={getTrend(chartData.disk)}
            delay={0.3}
          />

          <EnhancedMetricCard
            icon={<Clock className="h-6 w-6 text-purple-400" />}
            title="Uptime"
            value={formatUptime(systemStats?.resource?.uptime || '')}
            subtitle="Tempo ativo do sistema"
            color="purple"
            delay={0.4}
          />
        </div>
      </div>

      {/* Hotspot Statistics */}
      <div>
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold text-white mb-6 flex items-center gap-2"
        >
          <Wifi className="h-5 w-5 text-green-400" />
          Estatísticas do Hotspot
        </motion.h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedMetricCard
            icon={<Users className="h-6 w-6 text-blue-400" />}
            title="Usuários Total"
            value={hotspotStats?.totalUsers || 0}
            subtitle="Usuários cadastrados"
            color="blue"
            delay={0.5}
          />

          <EnhancedMetricCard
            icon={<Activity className="h-6 w-6 text-green-400" />}
            title="Usuários Ativos"
            value={hotspotStats?.activeUsers || 0}
            subtitle="Conectados agora"
            color="green"
            chartData={chartData.activeUsers}
            ChartComponent={ActiveUsersChart}
            trend={getTrend(chartData.activeUsers)}
            delay={0.6}
          />

          <EnhancedMetricCard
            icon={<Database className="h-6 w-6 text-orange-400" />}
            title="Perfis"
            value={hotspotStats?.totalProfiles || 0}
            subtitle="Planos configurados"
            color="orange"
            delay={0.7}
          />

          <EnhancedMetricCard
            icon={<Server className="h-6 w-6 text-purple-400" />}
            title="Servidores"
            value={hotspotStats?.totalServers || 0}
            subtitle="Hotspot servers"
            color="purple"
            delay={0.8}
          />
        </div>
      </div>

      {/* System Information Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="bg-black/40 border-gray-800/50 p-8 hover:border-gray-700/50 transition-all duration-300">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gray-600/20 rounded-xl">
              <Info className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white">Informações do Sistema</h3>
          </div>

          <div className="system-info-grid">
            <div className="system-info-item">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Arquitetura</h4>
              <p className="text-white font-semibold text-lg">{systemStats?.resource?.['architecture-name'] || 'N/A'}</p>
            </div>

            <div className="system-info-item">
              <h4 className="text-sm font-medium text-gray-400 mb-3">RouterBoard</h4>
              <p className="text-white font-semibold text-lg">{systemStats?.resource?.['board-name'] || 'N/A'}</p>
            </div>

            <div className="system-info-item">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Versão RouterOS</h4>
              <p className="text-white font-semibold text-lg">{systemStats?.resource?.version || 'N/A'}</p>
            </div>

            <div className="system-info-item">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Processador</h4>
              <p className="text-white font-semibold text-lg">
                {systemStats?.resource?.['cpu-count'] || 'N/A'} cores
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {systemStats?.resource?.['cpu-frequency'] || 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-600/10 border border-red-600/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <Info className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-red-300 font-medium">Erro no carregamento</h4>
                <p className="text-red-400/80 text-sm mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OverviewTabFinal