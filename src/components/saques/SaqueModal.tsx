import React, { useState, useEffect } from 'react'
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
    valor: 0,
    chave_pix: '',
    tipo_chave: ''
  })
  const saldoDisponivel = user?.saldo || 0

  // Carregar chave PIX automaticamente quando modal abrir
  useEffect(() => {
    if (open && user?.chave_pix) {
      setFormData(prev => ({
        ...prev,
        chave_pix: user.chave_pix || ''
      }))
    }
  }, [open, user?.chave_pix])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const valor = formData.valor
    
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
        chave_pix: formData.chave_pix,
        tipo_chave: formData.tipo_chave
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
      setFormData({ valor: 0, chave_pix: '', tipo_chave: '' })
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

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Solicitar Saque"
      description="Preencha os dados para solicitar seu saque"
      size="md"
      className="bg-black border border-gray-700"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ModalContent>
          {/* Valor do saque */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valor do Saque
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                min="1"
                max={saldoDisponivel}
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
                className="pl-10"
                required
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Saldo disponível: R$ {saldoDisponivel.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* Chave PIX */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chave PIX
            </label>
            <Input
              type="text"
              value={formData.chave_pix}
              onChange={(e) => setFormData(prev => ({ ...prev, chave_pix: e.target.value }))}
              placeholder="Digite sua chave PIX"
              required
            />
          </div>

          {/* Tipo da chave PIX */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo da Chave PIX
            </label>
            <select
              value={formData.tipo_chave}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo_chave: e.target.value }))}
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              required
            >
              <option value="">Selecione o tipo</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Chave Aleatória</option>
            </select>
          </div>

          {/* Status visual */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-400">
              <ArrowDown className="h-4 w-4" />
              <span className="text-sm font-medium">Status: Aguardando aprovação</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">
              O saque será processado em até 24 horas úteis
            </p>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || formData.valor <= 0 || formData.valor > saldoDisponivel}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Solicitando...' : 'Solicitar Saque'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}