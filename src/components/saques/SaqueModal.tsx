import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalFooter, Button, Input, useToast } from '../ui'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { ArrowDown, DollarSign, Clock, Shield, Wallet } from 'lucide-react'

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
      className="bg-black/90 backdrop-blur-xl border border-gray-800/50"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ModalContent>
          {/* Saldo Disponível Card */}
          <div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20">
                <Wallet className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Saldo Disponível</p>
                <p className="text-2xl font-bold text-green-400">R$ {saldoDisponivel.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Valor do saque */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <DollarSign className="h-4 w-4 text-orange-400" />
              Valor do Saque
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                min="50"
                max={saldoDisponivel}
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                placeholder="50,00"
                className="pl-10 bg-black/40 border-gray-800/50 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl backdrop-blur-sm"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Valor mínimo: R$ 50,00 • Máximo: R$ {saldoDisponivel.toFixed(2)}
            </p>
          </div>

          {/* Chave PIX */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Shield className="h-4 w-4 text-blue-400" />
              Chave PIX
            </label>
            <Input
              type="text"
              value={formData.chave_pix}
              onChange={(e) => setFormData(prev => ({ ...prev, chave_pix: e.target.value }))}
              placeholder="Digite sua chave PIX"
              className="bg-black/40 border-gray-800/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl backdrop-blur-sm"
              required
            />
          </div>

          {/* Tipo da chave PIX */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Tipo da Chave PIX
            </label>
            <select
              value={formData.tipo_chave}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo_chave: e.target.value }))}
              className="w-full px-3 py-3 bg-black/40 border border-gray-800/50 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all backdrop-blur-sm"
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
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Clock className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-300">Status: Aguardando aprovação</p>
                <p className="text-xs text-orange-400/70 mt-1">
                  O saque será processado em até 24 horas úteis
                </p>
              </div>
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-gray-800/50 text-gray-300 hover:text-white hover:border-gray-700 hover:bg-gray-800/50 rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || formData.valor < 50 || formData.valor > saldoDisponivel}
            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {loading ? 'Solicitando...' : 'Solicitar Saque'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}