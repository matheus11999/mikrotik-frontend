/**
 * 📊 Overview Tab - Visão Geral do MikroTik
 * 
 * Estatísticas principais do sistema: CPU, memória, disco, usuários, etc.
 */

import React, { useState, useEffect, useCallback } from 'react'
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
  TrendingUp
} from 'lucide-react'

// Components
import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { useToast } from '../../ui/toast'

// Chart components (if available)
// import { SparkLineChart } from '@mui/x-charts/SparkLineChart'

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

const OverviewTab: React.FC<OverviewTabProps> = ({
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
      setSystemStats({ resource: statsData })
      
    } catch (error) {
      console.error('[OverviewTab] Error fetching system stats:', error)
      setError('Erro ao carregar estatísticas do sistema')
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
      setHotspotStats(stats)
      
    } catch (error) {
      console.error('[OverviewTab] Error fetching hotspot stats:', error)
    }
  }, [mikrotikId, baseUrl, headers])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (mikrotikId && baseUrl && session) {
        setLoading(true)
        setError(null)
        
        try {
          await Promise.all([
            fetchSystemStats(),
            fetchHotspotStats()
          ])
        } finally {
          setLoading(false)
        }
      }
    }

    loadData()
  }, [mikrotikId, baseUrl, session, fetchSystemStats, fetchHotspotStats])

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
    
    // Parse uptime format like "1w2d3h4m5s"
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
  const getMemoryUsagePercent = (): number => {
    if (!systemStats?.resource) return 0
    
    const total = parseInt(systemStats.resource['total-memory'] || '0')
    const free = parseInt(systemStats.resource['free-memory'] || '0')
    
    if (total === 0) return 0
    return Math.round(((total - free) / total) * 100)
  }

  // Calculate disk usage percentage
  const getDiskUsagePercent = (): number => {
    if (!systemStats?.resource) return 0
    
    const total = parseInt(systemStats.resource['total-hdd-space'] || '0')
    const free = parseInt(systemStats.resource['free-hdd-space'] || '0')
    
    if (total === 0) return 0
    return Math.round(((total - free) / total) * 100)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-black/40 border border-gray-800/50 rounded-2xl p-6 animate-pulse">
              <div className="h-8 bg-gray-700/30 rounded mb-4"></div>
              <div className="h-12 bg-gray-700/30 rounded mb-2"></div>
              <div className="h-4 bg-gray-700/30 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-blue-500/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Cpu className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">CPU</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {systemStats?.resource?.['cpu-load'] || '0%'}
                </p>
                <p className="text-sm text-gray-400">Uso atual</p>
              </div>
              {systemStats?.resource?.['cpu-count'] && (
                <div className="text-xs text-gray-500">
                  <p>{systemStats.resource['cpu-count']} cores</p>
                  <p>{systemStats.resource['cpu-frequency']}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Memory Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <MemoryStick className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Memória</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {getMemoryUsagePercent()}%
                </p>
                <p className="text-sm text-gray-400">Em uso</p>
              </div>
              <div className="text-xs text-gray-500">
                <p>Livre: {formatBytes(systemStats?.resource?.['free-memory'] || 0)}</p>
                <p>Total: {formatBytes(systemStats?.resource?.['total-memory'] || 0)}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Disk Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-orange-500/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-600/20 rounded-lg">
                <HardDrive className="h-5 w-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Disco</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-orange-400">
                  {getDiskUsagePercent()}%
                </p>
                <p className="text-sm text-gray-400">Em uso</p>
              </div>
              <div className="text-xs text-gray-500">
                <p>Livre: {formatBytes(systemStats?.resource?.['free-hdd-space'] || 0)}</p>
                <p>Total: {formatBytes(systemStats?.resource?.['total-hdd-space'] || 0)}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Uptime Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Uptime</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-lg font-bold text-purple-400">
                  {formatUptime(systemStats?.resource?.uptime || '')}
                </p>
                <p className="text-sm text-gray-400">Tempo ativo</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Hotspot Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-blue-500/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Usuários Total</h3>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-400">
                {hotspotStats?.totalUsers || 0}
              </p>
              <p className="text-sm text-gray-400">Usuários hotspot</p>
            </div>
          </Card>
        </motion.div>

        {/* Active Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Usuários Ativos</h3>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-400">
                {hotspotStats?.activeUsers || 0}
              </p>
              <p className="text-sm text-gray-400">Conectados agora</p>
            </div>
          </Card>
        </motion.div>

        {/* Total Profiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-orange-500/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-600/20 rounded-lg">
                <Database className="h-5 w-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Planos Total</h3>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-400">
                {hotspotStats?.totalProfiles || 0}
              </p>
              <p className="text-sm text-gray-400">User profiles</p>
            </div>
          </Card>
        </motion.div>

        {/* Total Servers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-black/40 border-gray-800/50 p-6 hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Server className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Servidores</h3>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">
                {hotspotStats?.totalServers || 0}
              </p>
              <p className="text-sm text-gray-400">Hotspot servers</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* System Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="bg-black/40 border-gray-800/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-600/20 rounded-lg">
              <Info className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Informações do Sistema</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Architecture */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Arquitetura</h4>
              <p className="text-white">{systemStats?.resource?.['architecture-name'] || 'N/A'}</p>
            </div>

            {/* Board */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">RouterBoard</h4>
              <p className="text-white">{systemStats?.resource?.['board-name'] || 'N/A'}</p>
            </div>

            {/* Version */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Versão</h4>
              <p className="text-white">{systemStats?.resource?.version || 'N/A'}</p>
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
          <p className="text-red-300">{error}</p>
        </motion.div>
      )}
    </div>
  )
}

export default OverviewTab