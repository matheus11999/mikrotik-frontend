import React from 'react'
import { 
  UnifiedCard, 
  UnifiedIcon, 
  UnifiedBadge, 
  UnifiedTypography, 
  UnifiedButton 
} from '../ui/unified'
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Activity, 
  Router,
  Plus,
  Eye,
  Settings,
  HardDrive
} from 'lucide-react'

// Exemplo de componente usando o novo design system unificado
const UnifiedComponentsExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section - Landing Style */}
        <section className="text-center mikropix-spacing-section">
          <UnifiedTypography variant="hero" gradient className="mb-4">
            MikroPix Design System
          </UnifiedTypography>
          <UnifiedTypography variant="body" className="text-xl text-gray-300 mb-8">
            Componentes unificados para consistência visual perfeita
          </UnifiedTypography>
          <div className="flex gap-4 justify-center">
            <UnifiedButton variant="primary" size="lg" icon={Plus}>
              Começar Agora
            </UnifiedButton>
            <UnifiedButton variant="secondary" size="lg" icon={Eye}>
              Ver Demo
            </UnifiedButton>
          </div>
        </section>

        {/* Statistics Grid - Dashboard Style */}
        <section>
          <UnifiedTypography variant="title" className="mb-6 text-center">
            Estatísticas do Sistema
          </UnifiedTypography>
          
          <div className="mikropix-grid-stats">
            {/* Card 1 - Usuários Online */}
            <UnifiedCard variant="default" hover animation>
              <div className="flex items-center gap-3">
                <UnifiedIcon icon={Users} color="blue" size="lg" />
                <div>
                  <UnifiedTypography variant="heading" className="text-white">
                    1,234
                  </UnifiedTypography>
                  <UnifiedTypography variant="caption">
                    Usuários Online
                  </UnifiedTypography>
                </div>
              </div>
            </UnifiedCard>

            {/* Card 2 - Receita */}
            <UnifiedCard variant="default" hover animation>
              <div className="flex items-center gap-3">
                <UnifiedIcon icon={DollarSign} color="green" size="lg" />
                <div>
                  <UnifiedTypography variant="heading" className="text-white">
                    R$ 45.2K
                  </UnifiedTypography>
                  <UnifiedTypography variant="caption">
                    Receita Mensal
                  </UnifiedTypography>
                </div>
              </div>
            </UnifiedCard>

            {/* Card 3 - MikroTiks */}
            <UnifiedCard variant="default" hover animation>
              <div className="flex items-center gap-3">
                <UnifiedIcon icon={Router} color="orange" size="lg" />
                <div>
                  <UnifiedTypography variant="heading" className="text-white">
                    89
                  </UnifiedTypography>
                  <UnifiedTypography variant="caption">
                    MikroTiks Ativos
                  </UnifiedTypography>
                </div>
              </div>
            </UnifiedCard>

            {/* Card 4 - Performance */}
            <UnifiedCard variant="default" hover animation>
              <div className="flex items-center gap-3">
                <UnifiedIcon icon={Activity} color="purple" size="lg" />
                <div>
                  <UnifiedTypography variant="heading" className="text-white">
                    98.5%
                  </UnifiedTypography>
                  <UnifiedTypography variant="caption">
                    Uptime Sistema
                  </UnifiedTypography>
                </div>
              </div>
            </UnifiedCard>
          </div>
        </section>

        {/* Status Cards with Badges */}
        <section>
          <UnifiedTypography variant="title" className="mb-6">
            Status dos Serviços
          </UnifiedTypography>
          
          <div className="mikropix-grid-responsive">
            <UnifiedCard variant="glass" hover>
              <div className="flex items-center justify-between mb-4">
                <UnifiedIcon icon={Router} variant="simple" color="blue" size="lg" />
                <UnifiedBadge variant="online">Online</UnifiedBadge>
              </div>
              <UnifiedTypography variant="heading" className="text-white mb-2">
                Servidor Principal
              </UnifiedTypography>
              <UnifiedTypography variant="caption">
                Funcionando perfeitamente há 15 dias
              </UnifiedTypography>
            </UnifiedCard>

            <UnifiedCard variant="glass" hover>
              <div className="flex items-center justify-between mb-4">
                <UnifiedIcon icon={HardDrive} variant="simple" color="green" size="lg" />
                <UnifiedBadge variant="success">Estável</UnifiedBadge>
              </div>
              <UnifiedTypography variant="heading" className="text-white mb-2">
                Base de Dados
              </UnifiedTypography>
              <UnifiedTypography variant="caption">
                Backup realizado há 2 horas
              </UnifiedTypography>
            </UnifiedCard>

            <UnifiedCard variant="glass" hover>
              <div className="flex items-center justify-between mb-4">
                <UnifiedIcon icon={Activity} variant="simple" color="yellow" size="lg" />
                <UnifiedBadge variant="warning">Atenção</UnifiedBadge>
              </div>
              <UnifiedTypography variant="heading" className="text-white mb-2">
                Monitoramento
              </UnifiedTypography>
              <UnifiedTypography variant="caption">
                Alto uso de CPU detectado
              </UnifiedTypography>
            </UnifiedCard>
          </div>
        </section>

        {/* Action Cards */}
        <section>
          <UnifiedTypography variant="title" className="mb-6">
            Ações Rápidas
          </UnifiedTypography>
          
          <div className="mikropix-grid-responsive">
            <UnifiedCard variant="stats" hover animation className="text-center">
              <UnifiedIcon icon={Plus} color="blue" size="lg" className="mx-auto mb-4" />
              <UnifiedTypography variant="heading" className="text-white mb-3">
                Novo MikroTik
              </UnifiedTypography>
              <UnifiedTypography variant="body" className="text-gray-300 mb-4">
                Adicione um novo dispositivo à sua rede
              </UnifiedTypography>
              <UnifiedButton variant="primary" size="sm" className="w-full">
                Adicionar Agora
              </UnifiedButton>
            </UnifiedCard>

            <UnifiedCard variant="stats" hover animation className="text-center">
              <UnifiedIcon icon={BarChart3} color="green" size="lg" className="mx-auto mb-4" />
              <UnifiedTypography variant="heading" className="text-white mb-3">
                Relatórios
              </UnifiedTypography>
              <UnifiedTypography variant="body" className="text-gray-300 mb-4">
                Visualize estatísticas detalhadas
              </UnifiedTypography>
              <UnifiedButton variant="secondary" size="sm" className="w-full">
                Ver Relatórios
              </UnifiedButton>
            </UnifiedCard>

            <UnifiedCard variant="stats" hover animation className="text-center">
              <UnifiedIcon icon={Settings} color="purple" size="lg" className="mx-auto mb-4" />
              <UnifiedTypography variant="heading" className="text-white mb-3">
                Configurações
              </UnifiedTypography>
              <UnifiedTypography variant="body" className="text-gray-300 mb-4">
                Configure sua conta e preferências
              </UnifiedTypography>
              <UnifiedButton variant="outline" size="sm" className="w-full">
                Configurar
              </UnifiedButton>
            </UnifiedCard>
          </div>
        </section>

        {/* Button Examples */}
        <section>
          <UnifiedTypography variant="title" className="mb-6">
            Exemplos de Botões
          </UnifiedTypography>
          
          <UnifiedCard variant="default" className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Tamanhos */}
              <div>
                <UnifiedTypography variant="heading" className="text-white mb-3">
                  Tamanhos
                </UnifiedTypography>
                <div className="space-y-3">
                  <UnifiedButton variant="primary" size="sm">
                    Pequeno
                  </UnifiedButton>
                  <UnifiedButton variant="primary" size="md">
                    Médio
                  </UnifiedButton>
                  <UnifiedButton variant="primary" size="lg">
                    Grande
                  </UnifiedButton>
                </div>
              </div>

              {/* Variantes */}
              <div>
                <UnifiedTypography variant="heading" className="text-white mb-3">
                  Variantes
                </UnifiedTypography>
                <div className="space-y-3">
                  <UnifiedButton variant="primary">
                    Primário
                  </UnifiedButton>
                  <UnifiedButton variant="secondary">
                    Secundário
                  </UnifiedButton>
                  <UnifiedButton variant="outline">
                    Contorno
                  </UnifiedButton>
                  <UnifiedButton variant="ghost">
                    Fantasma
                  </UnifiedButton>
                  <UnifiedButton variant="destructive">
                    Perigo
                  </UnifiedButton>
                </div>
              </div>

              {/* Estados */}
              <div>
                <UnifiedTypography variant="heading" className="text-white mb-3">
                  Estados
                </UnifiedTypography>
                <div className="space-y-3">
                  <UnifiedButton variant="primary" icon={Plus}>
                    Com Ícone
                  </UnifiedButton>
                  <UnifiedButton variant="primary" loading>
                    Carregando
                  </UnifiedButton>
                  <UnifiedButton variant="primary" disabled>
                    Desabilitado
                  </UnifiedButton>
                </div>
              </div>
            </div>
          </UnifiedCard>
        </section>

      </div>
    </div>
  )
}

export default UnifiedComponentsExample