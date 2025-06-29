import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface PlanoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (planoData: any) => void
  plano?: any
  isEditing?: boolean
}

export function PlanoModal({ isOpen, onClose, onSave, plano, isEditing = false }: PlanoModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    rate_limit: '',
    session_timeout: '',
    idle_timeout: '',
    valor: ''
  })

  useEffect(() => {
    if (isEditing && plano) {
      setFormData({
        name: plano.name || '',
        rate_limit: plano['rate-limit'] || '',
        session_timeout: plano['session-timeout'] || '',
        idle_timeout: plano['idle-timeout'] || '',
        valor: plano.valor?.toString() || ''
      })
    } else {
      setFormData({
        name: '',
        rate_limit: '',
        session_timeout: '',
        idle_timeout: '',
        valor: ''
      })
    }
  }, [isEditing, plano, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-white">
              {isEditing ? 'Editar Plano' : 'Novo Plano'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Plano *
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Plano 1 Hora"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valor de Venda (R$) *
              </label>
              <Input
                name="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={handleChange}
                placeholder="Ex: 5.00"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Limite de Velocidade
              </label>
              <Input
                name="rate_limit"
                value={formData.rate_limit}
                onChange={handleChange}
                placeholder="Ex: 10M/5M ou 10M"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Formato: Download/Upload (Ex: 10M/5M) ou apenas Download (Ex: 10M)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tempo de Sessão
              </label>
              <Input
                name="session_timeout"
                value={formData.session_timeout}
                onChange={handleChange}
                placeholder="Ex: 3600 (1 hora em segundos)"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tempo em segundos (3600 = 1 hora)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timeout de Inatividade
              </label>
              <Input
                name="idle_timeout"
                value={formData.idle_timeout}
                onChange={handleChange}
                placeholder="Ex: 1800 (30 minutos)"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tempo de inatividade em segundos
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Dialog.Close asChild>
                <Button variant="outline" className="flex-1 border-gray-700 text-gray-300">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {isEditing ? 'Salvar Alterações' : 'Criar Plano'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 