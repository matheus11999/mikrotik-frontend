import React, { useState } from 'react'
import { Modal, ModalContent, ModalFooter, Button, Input, useToast } from '../ui'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { ArrowDown } from 'lucide-react'

interface SaqueModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SaqueModal({ open, onOpenChange, onSuccess }: SaqueModalProps) {
  const { user } = useAuthContext()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    valor: '',
    chave_pix: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const valor = parseFloat(formData.valor)
    
    // Validações
    if (!user || valor > (user.saldo || 0)) {
      addToast({
        type: 'error',
        title: 'Erro!',
        description: 'Saldo insuficiente'
      })
      return
    }

    if (valor < 50) {
      addToast({
        type: 'error',
        title: 'Valor inválido',
        description: 'Valor mínimo para saque é R$ 50,00'
      })
      return
    }

    if (!formData.chave_pix) {
      addToast({
        type: 'error',
        title: 'Chave PIX obrigatória',
        description: 'Informe sua chave PIX para receber o saque'
      })
      return
    }

    try {
      setLoading(true)
      
      const requestBody = {
        valor,
        metodo_pagamento: 'pix',
        chave_pix: formData.chave_pix
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/saques`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar saque')
      }

      addToast({
        type: 'success',
        title: 'Saque solicitado!',
        description: 'Sua solicitação foi enviada e será processada em breve.'
      })

      // Reset form
      setFormData({ valor: '', chave_pix: '' })
      onOpenChange(false)
      
      // Callback para atualizar lista
      if (onSuccess) onSuccess()

    } catch (error: any) {
      console.error('Error creating saque:', error)
      addToast({
        type: 'error',
        title: 'Erro ao solicitar saque',
        description: error?.message || 'Tente novamente em alguns instantes.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUseDefaultPix = () => {
    if (user?.pix_key) {
      setFormData(prev => ({ ...prev, chave_pix: user.pix_key || '' }))
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Solicitar Saque"
      description="Preencha os dados para solicitar seu saque via PIX"
      size="md"
      closeOnOverlayClick={!loading}
    >
      <form onSubmit={handleSubmit}>
        <ModalContent>
          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Valor (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
              placeholder="0.00"
              max={user?.saldo || 0}
              className="bg-gray-900 border-gray-800 text-white text-base"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Saldo disponível: R$ {user?.saldo?.toFixed(2) || '0.00'} | Valor mínimo: R$ 50,00
            </p>
          </div>

          {/* Chave PIX */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Chave PIX
            </label>
            <div className="flex space-x-2">
              <Input
                value={formData.chave_pix}
                onChange={(e) => setFormData(prev => ({ ...prev, chave_pix: e.target.value }))}
                placeholder="email@exemplo.com, CPF, telefone ou chave aleatória"
                className="bg-gray-900 border-gray-800 text-white text-base flex-1"
                required
                disabled={loading}
              />
              {user?.pix_key && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseDefaultPix}
                  disabled={loading}
                  className="border-gray-800 text-gray-300 hover:text-white whitespace-nowrap"
                >
                  Usar Padrão
                </Button>
              )}
            </div>
            {user?.pix_key && (
              <p className="text-xs text-gray-400 mt-1">
                Chave padrão: {user.pix_key}
              </p>
            )}
          </div>
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? (
              <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Processando...' : 'Solicitar Saque'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}