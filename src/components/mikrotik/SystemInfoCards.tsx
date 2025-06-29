import React from 'react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Users,
  UserCheck,
  Settings,
  Server,
  HardDrive,
  Cpu,
  Activity,
  Clock,
  Info,
  Tag,
  CheckCircle
} from 'lucide-react'

interface SystemStats {
  // System resource fields
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
  'write-sect-since-reboot'?: string
  'write-sect-total'?: string
  'bad-blocks'?: string
  
  // Nested objects
  resource?: {
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
    'write-sect-since-reboot'?: string
    'write-sect-total'?: string
    'bad-blocks'?: string
    cpu?: string
    platform?: string
  }
  
  routerboard?: {
    model?: string
    'board-name'?: string
    routerboard?: string
    revision?: string
    'serial-number'?: string
    'current-firmware'?: string
    'upgrade-firmware'?: string
    'factory-firmware'?: string
    'firmware-type'?: string
  }
  
  identity?: {
    name?: string
  }
}

interface SystemInfoCardsProps {
  systemInfo: {
    resource?: {
      'architecture-name'?: string
      'board-name'?: string
      'cpu-count'?: string
      'cpu-load'?: string
      'free-memory'?: string
      'total-memory'?: string
      'free-hdd-space'?: string
      'total-hdd-space'?: string
      cpu?: string
      'cpu-frequency'?: string
      uptime?: string
      version?: string
    }
    identity?: {
      name?: string
    }
    routerboard?: {
      model?: string
    }
  }
  totalUsers?: number
  activeUsers?: number
  totalProfiles?: number
  totalServers?: number
  totalServerProfiles?: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Componente de progresso circular
interface CircularProgressProps {
  value: number
  label: string
  color?: string
  size?: number
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  value, 
  label, 
  color = "blue",
  size = 80 
}) => {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference
  
  const strokeColor = value > 80 ? "text-red-400" : value > 60 ? "text-yellow-400" : "text-green-400"
  const bgColor = value > 80 ? "bg-red-400/5" : value > 60 ? "bg-yellow-400/5" : "bg-green-400/5"
  
  return (
    <div className="flex flex-col items-center">
      <div className={`relative p-3 rounded-full border border-gray-800 ${bgColor}`} style={{ width: size + 24, height: size + 24 }}>
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="transform -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-gray-800"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={strokeColor}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-white">{value}%</span>
          </div>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-300 mt-3">{label}</span>
    </div>
  )
}

export function SystemInfoCards({ 
  systemInfo, 
  totalUsers = 0, 
  activeUsers = 0, 
  totalProfiles = 0, 
  totalServers = 0, 
  totalServerProfiles = 0 
}: SystemInfoCardsProps) {
  // Formatar memória para MB
  const formatMemory = (memoryInBytes?: string) => {
    if (!memoryInBytes) return 'N/A'
    const mb = (parseInt(memoryInBytes) / (1024 * 1024)).toFixed(1)
    return `${mb}MB`
  }

  // Calcular porcentagens
  const cpuUsage = parseInt(systemInfo.resource?.['cpu-load'] || '0')
  const memoryUsage = systemInfo.resource?.['free-memory'] && systemInfo.resource?.['total-memory'] 
    ? Math.round(((parseInt(systemInfo.resource['total-memory']) - parseInt(systemInfo.resource['free-memory'])) / parseInt(systemInfo.resource['total-memory'])) * 100)
    : 0
  const diskUsage = systemInfo.resource?.['free-hdd-space'] && systemInfo.resource?.['total-hdd-space']
    ? Math.round(((parseInt(systemInfo.resource['total-hdd-space']) - parseInt(systemInfo.resource['free-hdd-space'])) / parseInt(systemInfo.resource['total-hdd-space'])) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {/* Modelo e Nome */}
      <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-gray-800 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <Server className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Dispositivo</h3>
              <p className="text-xs text-gray-400">Informações do hardware</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <span className="text-sm font-medium text-gray-300">Modelo:</span>
            <Badge variant="outline" className="bg-gray-800/50 text-white border-gray-600 font-medium">
              {systemInfo.routerboard?.model || systemInfo.resource?.['board-name'] || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <span className="text-sm font-medium text-gray-300">Sistema:</span>
            <Badge variant="outline" className="bg-gray-800/50 text-white border-gray-600 font-medium">
              {systemInfo.identity?.name || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <span className="text-sm font-medium text-gray-300">Arquitetura:</span>
            <Badge variant="outline" className="bg-gray-800/50 text-white border-gray-600 font-medium">
              {systemInfo.resource?.['architecture-name'] || 'N/A'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* CPU */}
      <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-gray-800 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <Cpu className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Processador</h3>
              <p className="text-xs text-gray-400">Performance e especificações</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{cpuUsage}%</div>
            <div className="text-xs text-gray-400">Uso atual</div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <span className="text-sm font-medium text-gray-300">Modelo:</span>
            <Badge variant="outline" className="bg-gray-800/50 text-white border-gray-600 font-medium">
              {systemInfo.resource?.cpu || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <span className="text-sm font-medium text-gray-300">Frequência:</span>
            <Badge variant="outline" className="bg-gray-800/50 text-white border-gray-600 font-medium">
              {systemInfo.resource?.['cpu-frequency'] ? `${systemInfo.resource['cpu-frequency']}MHz` : 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <span className="text-sm font-medium text-gray-300">Núcleos:</span>
            <Badge variant="outline" className="bg-gray-800/50 text-white border-gray-600 font-medium">
              {systemInfo.resource?.['cpu-count'] || 'N/A'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Métricas do Sistema */}
      <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-gray-800 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <Activity className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Métricas</h3>
              <p className="text-xs text-gray-400">Uso de recursos em tempo real</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 py-4">
          <CircularProgress 
            value={cpuUsage} 
            label="CPU" 
            size={70}
          />
          <CircularProgress 
            value={memoryUsage} 
            label="Memória" 
            size={70}
          />
          <CircularProgress 
            value={diskUsage} 
            label="Disco" 
            size={70}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="text-xs text-gray-400">Memória Livre</div>
            <div className="text-sm font-medium text-white">{formatMemory(systemInfo.resource?.['free-memory'])}</div>
          </div>
          <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="text-xs text-gray-400">Memória Total</div>
            <div className="text-sm font-medium text-white">{formatMemory(systemInfo.resource?.['total-memory'])}</div>
          </div>
          <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="text-xs text-gray-400">Espaço Livre</div>
            <div className="text-sm font-medium text-white">{formatBytes(parseInt(systemInfo.resource?.['free-hdd-space'] || '0'))}</div>
          </div>
        </div>
      </Card>

      {/* Usuários Hotspot */}
      <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-gray-800 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <Users className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Usuários</h3>
              <p className="text-xs text-gray-400">Conexões hotspot</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{totalUsers}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <span className="text-sm font-medium text-gray-300">Ativos:</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <Badge variant="outline" className="bg-green-500/10 text-green-300 border-green-500/30 font-medium">
                {activeUsers}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <span className="text-sm font-medium text-gray-300">Offline:</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <Badge variant="outline" className="bg-gray-500/10 text-gray-300 border-gray-500/30 font-medium">
                {totalUsers - activeUsers}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <span className="text-sm font-medium text-gray-300">Taxa de Uso:</span>
            <Badge variant="outline" className={`font-medium ${totalUsers > 0 ? 'bg-green-500/10 text-green-300 border-green-500/30' : 'bg-gray-500/10 text-gray-300 border-gray-500/30'}`}>
              {totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}%` : '0%'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Planos e Servidores */}
      <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-gray-800 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <Settings className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Configurações</h3>
              <p className="text-xs text-gray-400">Planos e serviços</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{totalProfiles + totalServers + totalServerProfiles}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">Planos:</span>
            </div>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 font-medium">
              {totalProfiles}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">Servidores:</span>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 font-medium">
              {totalServers}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-slate-300">Perfis:</span>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-300 border-green-500/30 font-medium">
              {totalServerProfiles}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Status Geral */}
      <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Status</h3>
              <p className="text-xs text-slate-400">Estado do sistema</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-400">Online</span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">Uptime:</span>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 font-medium">
              {systemInfo.resource?.uptime || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">Versão:</span>
            </div>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 font-medium">
              {systemInfo.resource?.version || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-slate-300">Performance:</span>
            </div>
            <Badge variant="outline" className={`font-medium ${cpuUsage < 50 ? 'bg-green-500/10 text-green-300 border-green-500/30' : cpuUsage < 80 ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'}`}>
              {cpuUsage < 50 ? 'Ótima' : cpuUsage < 80 ? 'Boa' : 'Alta'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">Espaço Total:</span>
            </div>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 font-medium">
              {formatBytes(parseInt(systemInfo.resource?.['total-hdd-space'] || '0'))}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SystemInfoCards