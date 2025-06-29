import { Button } from './ui/button'
import { Edit, Trash2, Clock, Zap, TrendingUp } from 'lucide-react'

interface PlanoCardProps {
  plano: {
    '.id': string
    name: string
    'rate-limit'?: string
    'session-timeout'?: string
    'idle-timeout'?: string
    valor?: number
    ativo?: boolean
  }
  onEdit: (plano: any) => void
  onDelete: (id: string) => void
}

export function PlanoCard({ plano, onEdit, onDelete }: PlanoCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${plano.ativo !== false ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <h3 className="text-lg font-semibold text-white">{plano.name}</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 p-2"
            onClick={() => onEdit(plano)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-red-600/50 text-red-400 hover:text-red-300 hover:border-red-500 hover:bg-red-500/10 p-2"
            onClick={() => onDelete(plano['.id'])}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {plano['rate-limit'] && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800">
            <Zap className="h-4 w-4 text-yellow-400" />
            <div>
              <p className="text-xs text-gray-400">Velocidade</p>
              <p className="text-sm text-white">{plano['rate-limit']}</p>
            </div>
          </div>
        )}
        
        {plano['session-timeout'] && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800">
            <Clock className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Tempo de Sessão</p>
              <p className="text-sm text-white">{plano['session-timeout']}</p>
            </div>
          </div>
        )}
        
        {plano.valor && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs text-gray-400">Valor de Venda</p>
              <p className="text-sm text-white">R$ {plano.valor.toFixed(2)}</p>
            </div>
          </div>
        )}
        
        {plano['idle-timeout'] && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800">
            <Clock className="h-4 w-4 text-orange-400" />
            <div>
              <p className="text-xs text-gray-400">Timeout Idle</p>
              <p className="text-sm text-white">{plano['idle-timeout']}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 