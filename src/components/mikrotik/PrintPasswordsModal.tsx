import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { SimpleModal } from '../SimpleModal'
import { Printer, Eye, Users, FileText, X, ChevronLeft, ChevronRight, Wifi, MessageCircle, MapPin, Phone, Globe, Star, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface HotspotUser {
  '.id': string
  name: string
  password?: string
  profile?: string
  comment?: string
  disabled?: boolean
  uptime?: string
}

interface HotspotProfile {
  '.id': string
  name: string
  'rate-limit'?: string
  valor?: number
}

interface PrintPasswordsModalProps {
  isOpen: boolean
  onClose: () => void
  users: HotspotUser[]
  profiles: HotspotProfile[]
  mikrotikId: string
  session: any
}

// Templates de senhas redesenhados e aprimorados
const PASSWORD_TEMPLATES = [
  {
    id: 'wifi-classic',
    name: 'Wi-Fi Clássico',
    icon: Wifi,
    color: 'from-blue-600 to-blue-800',
    variables: [
      { key: 'NOME_WIFI', label: 'Nome da Rede Wi-Fi', defaultValue: 'MikroPix-Guest', type: 'text', removable: true },
      { key: 'TITULO_ACESSO', label: 'Título do Acesso', defaultValue: 'USUÁRIO & SENHA', type: 'text', removable: true },
      { key: 'LOGO_URL', label: 'URL do Logo', defaultValue: '', type: 'url', removable: true }
    ],
    preview: `
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 20px; border-radius: 12px; color: white; text-align: center; width: 100%; margin: auto;">
        <div style="font-size: 28px; margin-bottom: 8px;">📶</div>
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">{{NOME_WIFI}}</div>
        <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; border: 2px dashed rgba(255,255,255,0.3);">
          <div style="font-size: 11px; margin-bottom: 5px; opacity: 0.8;">{{TITULO_ACESSO}}</div>
          <div style="font-size: 28px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 2px;">{{USUARIO}}</div>
        </div>
      </div>
    `
  },
  {
    id: 'business-premium',
    name: 'Empresarial Premium',
    icon: Star,
    color: 'from-purple-600 to-pink-600',
    variables: [
      { key: 'EMPRESA', label: 'Nome da Empresa', defaultValue: 'MikroPix Telecom', type: 'text', removable: true },
      { key: 'WHATSAPP', label: 'WhatsApp Suporte', defaultValue: '(11) 99999-9999', type: 'text', removable: true },
      { key: 'TITULO_ACESSO', label: 'Título do Acesso', defaultValue: 'ACESSO WI-FI', type: 'text', removable: true },
      { key: 'LOGO_URL', label: 'URL do Logo', defaultValue: '', type: 'url', removable: true }
    ],
    preview: `
      <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 20px; border-radius: 12px; color: white; text-align: center; width: 100%; margin: auto;">
        <div style="font-size: 26px; margin-bottom: 8px;">⭐</div>
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 3px;">{{EMPRESA}}</div>
        <div style="font-size: 11px; margin-bottom: 15px; opacity: 0.9;">📱 {{WHATSAPP}}</div>
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
          <div style="font-size: 11px; margin-bottom: 5px; opacity: 0.8;">{{TITULO_ACESSO}}</div>
          <div style="font-size: 26px; font-weight: bold; font-family: 'Courier New', monospace;">{{USUARIO}}</div>
        </div>
      </div>
    `
  },
  {
    id: 'whatsapp-support',
    name: 'WhatsApp Suporte',
    icon: MessageCircle,
    color: 'from-green-500 to-green-600',
    variables: [
      { key: 'WHATSAPP', label: 'WhatsApp', defaultValue: '(11) 99999-9999', type: 'text', removable: true },
      { key: 'WIFI_NAME', label: 'Nome do Wi-Fi', defaultValue: 'MinhaRede', type: 'text', removable: true },
      { key: 'TITULO_ACESSO', label: 'Título do Acesso', defaultValue: 'LOGIN', type: 'text', removable: true },
      { key: 'LOGO_URL', label: 'URL do Logo', defaultValue: '', type: 'url', removable: true }
    ],
    preview: `
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; color: white; text-align: center; width: 100%; margin: auto;">
        <div style="font-size: 26px; margin-bottom: 8px;">💬</div>
        <div style="font-size: 14px; margin-bottom: 5px;">📱 {{WHATSAPP}}</div>
        <div style="font-size: 12px; margin-bottom: 15px;">📶 {{WIFI_NAME}}</div>
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
          <div style="font-size: 11px; margin-bottom: 5px; opacity: 0.8;">{{TITULO_ACESSO}}</div>
          <div style="font-size: 26px; font-weight: bold; font-family: 'Courier New', monospace;">{{USUARIO}}</div>
        </div>
      </div>
    `
  },
  {
    id: 'elegant-simple',
    name: 'Elegante Simples',
    icon: Star,
    color: 'from-gray-100 to-white',
    variables: [
      { key: 'TITULO_ACESSO', label: 'Título do Acesso', defaultValue: 'CÓDIGO DE ACESSO', type: 'text', removable: true },
      { key: 'LOGO_URL', label: 'URL do Logo', defaultValue: '', type: 'url', removable: true }
    ],
    preview: `
      <div style="background: white; border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; color: #374151; text-align: center; width: 100%; margin: auto;">
        <div style="font-size: 26px; margin-bottom: 15px;">⭐</div>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; border: 1px solid #d1d5db;">
          <div style="font-size: 11px; margin-bottom: 5px; color: #6b7280;">{{TITULO_ACESSO}}</div>
          <div style="font-size: 26px; font-weight: bold; font-family: 'Courier New', monospace; color: #1f2937;">{{USUARIO}}</div>
        </div>
      </div>
    `
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    icon: Wifi,
    color: 'from-cyan-500 to-blue-500',
    variables: [
      { key: 'TITULO_ACESSO', label: 'Título do Acesso', defaultValue: 'ACCESS CODE', type: 'text', removable: true },
      { key: 'LOGO_URL', label: 'URL do Logo', defaultValue: '', type: 'url', removable: true }
    ],
    preview: `
      <div style="background: #0f172a; border: 2px solid #06b6d4; padding: 20px; border-radius: 12px; color: #06b6d4; text-align: center; width: 100%; margin: auto; box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);">
        <div style="font-size: 26px; margin-bottom: 15px; color: #06b6d4;">⚡</div>
        <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid #06b6d4; padding: 15px; border-radius: 8px;">
          <div style="font-size: 11px; margin-bottom: 5px; opacity: 0.8;">{{TITULO_ACESSO}}</div>
          <div style="font-size: 26px; font-weight: bold; font-family: 'Courier New', monospace; color: #06b6d4;">{{USUARIO}}</div>
        </div>
      </div>
    `
  },
  {
    id: 'wide-classic',
    name: 'Clássico Largo',
    icon: Globe,
    color: 'from-indigo-600 to-purple-600',
    variables: [
      { key: 'EMPRESA', label: 'Nome da Empresa', defaultValue: 'MikroPix Telecom', type: 'text', removable: true },
      { key: 'NOME_WIFI', label: 'Nome da Rede Wi-Fi', defaultValue: 'MikroPix-Guest', type: 'text', removable: true },
      { key: 'WHATSAPP', label: 'WhatsApp', defaultValue: '(11) 99999-9999', type: 'text', removable: true },
      { key: 'ENDERECO', label: 'Endereço', defaultValue: 'Rua das Flores, 123 - Centro', type: 'text', removable: true },
      { key: 'TITULO_ACESSO', label: 'Título do Acesso', defaultValue: 'DADOS DE ACESSO', type: 'text', removable: true },
      { key: 'LOGO_URL', label: 'URL do Logo', defaultValue: '', type: 'url', removable: true }
    ],
    preview: `
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 20px; border-radius: 12px; color: white; text-align: center; width: 100%; margin: auto;">
        <div style="font-size: 24px; margin-bottom: 8px;">🌐</div>
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">{{EMPRESA}}</div>
        <div style="font-size: 12px; margin-bottom: 3px;">📶 {{NOME_WIFI}}</div>
        <div style="font-size: 11px; margin-bottom: 3px;">📱 {{WHATSAPP}}</div>
        <div style="font-size: 10px; margin-bottom: 12px; opacity: 0.9;">📍 {{ENDERECO}}</div>
        <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px;">
          <div style="font-size: 10px; margin-bottom: 4px; opacity: 0.8;">{{TITULO_ACESSO}}</div>
          <div style="font-size: 24px; font-weight: bold; font-family: 'Courier New', monospace;">{{USUARIO}}</div>
        </div>
      </div>
    `
  },
  {
    id: 'wide-modern',
    name: 'Moderno Largo',
    icon: Star,
    color: 'from-emerald-600 to-teal-600',
    variables: [
      { key: 'EMPRESA', label: 'Nome da Empresa', defaultValue: 'MikroPix Telecom', type: 'text', removable: true },
      { key: 'SLOGAN', label: 'Slogan da Empresa', defaultValue: 'Internet de qualidade para você!', type: 'text', removable: true },
      { key: 'NOME_WIFI', label: 'Nome da Rede Wi-Fi', defaultValue: 'MikroPix-Guest', type: 'text', removable: true },
      { key: 'WHATSAPP', label: 'WhatsApp', defaultValue: '(11) 99999-9999', type: 'text', removable: true },
      { key: 'SITE', label: 'Website', defaultValue: 'www.mikropix.online', type: 'text', removable: true },
      { key: 'TITULO_ACESSO', label: 'Título do Acesso', defaultValue: 'CREDENCIAIS DE ACESSO', type: 'text', removable: true },
      { key: 'LOGO_URL', label: 'URL do Logo', defaultValue: '', type: 'url', removable: true }
    ],
    preview: `
      <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 20px; border-radius: 12px; color: white; text-align: center; width: 100%; margin: auto;">
        <div style="font-size: 24px; margin-bottom: 6px;">⭐</div>
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 2px;">{{EMPRESA}}</div>
        <div style="font-size: 10px; margin-bottom: 8px; font-style: italic; opacity: 0.9;">{{SLOGAN}}</div>
        <div style="font-size: 12px; margin-bottom: 2px;">📶 {{NOME_WIFI}}</div>
        <div style="font-size: 11px; margin-bottom: 2px;">📱 {{WHATSAPP}}</div>
        <div style="font-size: 10px; margin-bottom: 12px;">🌐 {{SITE}}</div>
        <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px;">
          <div style="font-size: 10px; margin-bottom: 4px; opacity: 0.8;">{{TITULO_ACESSO}}</div>
          <div style="font-size: 22px; font-weight: bold; font-family: 'Courier New', monospace;">{{USUARIO}}</div>
        </div>
      </div>
    `
  },
  {
    id: 'ticket-style',
    name: 'Estilo Cupom',
    icon: FileText,
    color: 'from-orange-500 to-red-500',
    variables: [
      { key: 'ESTABELECIMENTO', label: 'Nome do Estabelecimento', defaultValue: 'Café & Wi-Fi MikroPix', type: 'text', removable: true },
      { key: 'ENDERECO', label: 'Endereço', defaultValue: 'Rua das Flores, 123 - Centro', type: 'text', removable: true },
      { key: 'TELEFONE', label: 'Telefone', defaultValue: '(11) 3333-4444', type: 'text', removable: true },
      { key: 'WHATSAPP', label: 'WhatsApp', defaultValue: '(11) 99999-9999', type: 'text', removable: true },
      { key: 'NOME_WIFI', label: 'Nome da Rede Wi-Fi', defaultValue: 'MikroPix-Guest', type: 'text', removable: true },
      { key: 'VALIDADE', label: 'Validade', defaultValue: '24 horas', type: 'text', removable: true },
      { key: 'TITULO_ACESSO', label: 'Título do Acesso', defaultValue: 'ACESSO WI-FI GRATUITO', type: 'text', removable: true },
      { key: 'LOGO_URL', label: 'URL do Logo', defaultValue: '', type: 'url', removable: true }
    ],
    preview: `
      <div style="background: white; border: 2px dashed #f97316; padding: 16px; border-radius: 8px; color: #374151; text-align: center; width: 100%; margin: auto; font-family: monospace;">
        <div style="font-size: 20px; margin-bottom: 6px;">🎫</div>
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px; color: #f97316;">{{ESTABELECIMENTO}}</div>
        <div style="font-size: 10px; margin-bottom: 2px;">📍 {{ENDERECO}}</div>
        <div style="font-size: 10px; margin-bottom: 2px;">📞 {{TELEFONE}}</div>
        <div style="font-size: 10px; margin-bottom: 8px;">📱 {{WHATSAPP}}</div>
        <div style="border-top: 1px dashed #ccc; padding-top: 8px; margin-top: 8px;">
          <div style="font-size: 11px; margin-bottom: 2px;">📶 {{NOME_WIFI}}</div>
          <div style="font-size: 9px; margin-bottom: 6px; color: #666;">{{TITULO_ACESSO}}</div>
          <div style="background: #fef3cd; border: 1px solid #f97316; padding: 8px; border-radius: 4px;">
            <div style="font-size: 18px; font-weight: bold; color: #f97316;">{{USUARIO}}</div>
          </div>
          <div style="font-size: 9px; margin-top: 4px; color: #666;">Válido por: {{VALIDADE}}</div>
        </div>
      </div>
    `
  }
]

const PrintPasswordsModal: React.FC<PrintPasswordsModalProps> = ({
  isOpen,
  onClose,
  users,
  profiles,
  mikrotikId,
  session
}) => {
  const [step, setStep] = useState<'select-plan' | 'select-template' | 'preview'>('select-plan')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customTemplate, setCustomTemplate] = useState('')
  const [planUsers, setPlanUsers] = useState<HotspotUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  
  // Template pagination
  const [currentPage, setCurrentPage] = useState(1)
  const templatesPerPage = 10
  const totalPages = Math.ceil(PASSWORD_TEMPLATES.length / templatesPerPage)
  const startIndex = (currentPage - 1) * templatesPerPage
  const currentTemplates = PASSWORD_TEMPLATES.slice(startIndex, startIndex + templatesPerPage)
  
  // Template variables
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [removedFields, setRemovedFields] = useState<Set<string>>(new Set())

  // Resetar estado e carregar template quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setStep('select-plan')
      setSelectedPlan('')
      setSelectedTemplate('')
      setCustomTemplate('')
      setPlanUsers([])
      setTemplateVariables({})
      setRemovedFields(new Set())
      setCurrentPage(1)
      loadCustomTemplate()
    }
  }, [isOpen])

  // Carregar template personalizado salvo
  const loadCustomTemplate = async () => {
    if (!session?.user?.id || !mikrotikId) return

    setIsLoadingTemplate(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mikrotik/password-template/${mikrotikId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.template) {
          setCustomTemplate(data.template)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar template personalizado:', error)
    } finally {
      setIsLoadingTemplate(false)
    }
  }

  // Salvar template personalizado
  const saveCustomTemplate = async (template: string) => {
    if (!session?.user?.id || !mikrotikId) return

    setIsSavingTemplate(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mikrotik/password-template/${mikrotikId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ template })
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Erro ao salvar template personalizado:', error)
      return false
    } finally {
      setIsSavingTemplate(false)
    }
  }

  // Atualizar variáveis do template quando template é selecionado
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== 'custom') {
      const template = PASSWORD_TEMPLATES.find(t => t.id === selectedTemplate)
      if (template?.variables) {
        const newVariables: Record<string, string> = {}
        template.variables.forEach(variable => {
          newVariables[variable.key] = variable.defaultValue
        })
        setTemplateVariables(newVariables)
        setRemovedFields(new Set())
      }
    }
  }, [selectedTemplate])

  // Selecionar plano
  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName)
    setIsLoadingUsers(true)
    
    // Filtrar usuários do plano que nunca se conectaram
    const filteredUsers = users.filter(user => 
      user.profile === planName && 
      (!user.uptime || user.uptime === '0' || user.uptime === '0s')
    )
    
    setPlanUsers(filteredUsers)
    setIsLoadingUsers(false)
    setStep('select-template')
  }

  // Selecionar template
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setStep('preview')
  }

  // Usar template personalizado
  const handleCustomTemplate = async () => {
    if (!customTemplate.trim()) return
    
    const saved = await saveCustomTemplate(customTemplate)
    if (saved) {
      setSelectedTemplate('custom')
      setStep('preview')
    } else {
      alert('Erro ao salvar template personalizado')
    }
  }

  // Remover/restaurar campo
  const toggleFieldRemoval = (fieldKey: string) => {
    const newRemovedFields = new Set(removedFields)
    if (newRemovedFields.has(fieldKey)) {
      newRemovedFields.delete(fieldKey)
    } else {
      newRemovedFields.add(fieldKey)
    }
    setRemovedFields(newRemovedFields)
  }

  // Gerar HTML final com todas as senhas
  const generateFinalHTML = () => {
    let finalHTML = ''
    
    if (selectedTemplate === 'custom') {
      // Template personalizado - estrutura mais simples
      finalHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Senhas do Plano ${selectedPlan} - ${planUsers.length} usuários</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background: #f5f5f5; 
              font-size: 14px;
            }
            h1 { 
              text-align: center; 
              margin-bottom: 20px; 
              color: #333; 
              font-size: 24px;
            }
            .footer {
              text-align: center;
              margin-bottom: 30px;
              color: #666;
              font-size: 14px;
            }
            .grid { 
              display: grid; 
              grid-template-columns: repeat(5, 1fr); 
              gap: 10px; 
              margin-bottom: 20px; 
            }
            .card { 
              page-break-inside: avoid; 
              max-width: 180px;
              margin: 0 auto;
            }
            @media print {
              * { 
                -webkit-print-color-adjust: exact !important; 
                color-adjust: exact !important; 
                print-color-adjust: exact !important; 
              }
              body { background: white !important; margin: 10px; }
              .grid { grid-template-columns: repeat(5, 1fr); gap: 8px; }
              .card { max-width: 150px; }
            }
          </style>
        </head>
        <body>
          <h1>Senhas do Plano: ${selectedPlan}</h1>
          <div class="footer">www.mikropix.online - Gerenciamento de Mikrotik na Nuvem</div>
          <div class="grid">
      `
      
      planUsers.forEach(user => {
        let cardHTML = customTemplate
          .replace(/\{\{USUARIO\}\}/g, user.name)
          .replace(/\{\{SENHA\}\}/g, user.password || user.name)
        
        // Substituir variáveis personalizáveis no template customizado também
        Object.entries(templateVariables).forEach(([key, value]) => {
          cardHTML = cardHTML.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '')
        })
        
        finalHTML += `<div class="card">${cardHTML}</div>`
      })
      
      finalHTML += '</div></body></html>'
    } else {
      // Template predefinido - abordagem completamente nova
      const template = PASSWORD_TEMPLATES.find(t => t.id === selectedTemplate)
      if (!template) return ''

      // Determinar quantas colunas usar baseado no template
      const isWideTemplate = selectedTemplate.includes('wide') || selectedTemplate === 'ticket-style'
      const columns = isWideTemplate ? 3 : 5

      // Construir HTML do zero baseado no template
      finalHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Senhas do Plano ${selectedPlan} - ${planUsers.length} usuários</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background: #f5f5f5; 
              font-size: 14px;
            }
            h1 { 
              text-align: center; 
              margin-bottom: 20px; 
              color: #333; 
              font-size: 24px;
            }
            .footer {
              text-align: center;
              margin-bottom: 30px;
              color: #666;
              font-size: 14px;
            }
            .grid { 
              display: grid; 
              grid-template-columns: repeat(${columns}, 1fr); 
              gap: 10px; 
              margin-bottom: 20px; 
            }
            .card {
              background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              padding: 15px;
              border-radius: 12px;
              color: white;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              page-break-inside: avoid;
              max-width: ${isWideTemplate ? '280px' : '180px'};
              margin: 0 auto;
            }
            .wifi-icon { font-size: 28px; margin-bottom: 8px; }
            .wifi-name { font-size: 14px; font-weight: bold; margin-bottom: 12px; }
            .company-name { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
            .slogan { font-size: 11px; margin-bottom: 8px; font-style: italic; opacity: 0.9; }
            .whatsapp { font-size: 11px; margin-bottom: 8px; opacity: 0.9; }
            .contact { font-size: 12px; margin-bottom: 4px; }
            .wifi { font-size: 11px; margin-bottom: 12px; opacity: 0.9; }
            .icon { font-size: 28px; margin-bottom: 12px; }
            .address { font-size: 10px; margin-bottom: 8px; opacity: 0.9; }
            .phone { font-size: 10px; margin-bottom: 4px; opacity: 0.9; }
            .site { font-size: 10px; margin-bottom: 8px; opacity: 0.9; }
            .validity { font-size: 9px; margin-top: 4px; opacity: 0.8; }
            .code-container {
              background: rgba(255,255,255,0.15) !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              padding: 12px;
              border-radius: 8px;
              border: 2px dashed rgba(255,255,255,0.3);
            }
            .code-label { font-size: 10px; margin-bottom: 4px; opacity: 0.8; }
            .code-text { 
              font-size: 20px; 
              font-weight: bold; 
              font-family: 'Courier New', monospace; 
              letter-spacing: 1px;
              word-break: break-all;
            }
            
            /* Cores específicas por template */
            .business-premium .card {
              background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%) !important;
            }
            .whatsapp-support .card {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
            }
            .elegant-simple .card {
              background: white !important;
              border: 2px solid #e5e7eb !important;
              color: #374151 !important;
            }
            .elegant-simple .code-container {
              background: #f3f4f6 !important;
              border: 1px solid #d1d5db !important;
            }
            .elegant-simple .code-text {
              color: #1f2937 !important;
            }
            .elegant-simple .code-label {
              color: #6b7280 !important;
            }
            .neon-cyber .card {
              background: #0f172a !important;
              border: 2px solid #06b6d4 !important;
              color: #06b6d4 !important;
            }
            .neon-cyber .code-container {
              background: rgba(6, 182, 212, 0.1) !important;
              border: 1px solid #06b6d4 !important;
            }
            .neon-cyber .code-text {
              color: #06b6d4 !important;
            }
            .wide-classic .card {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
            }
            .wide-modern .card {
              background: linear-gradient(135deg, #059669 0%, #0d9488 100%) !important;
            }
            .ticket-style .card {
              background: white !important;
              border: 2px dashed #f97316 !important;
              color: #374151 !important;
              font-family: monospace !important;
            }
            .ticket-style .code-container {
              background: #fef3cd !important;
              border: 1px solid #f97316 !important;
            }
            .ticket-style .code-text {
              color: #f97316 !important;
            }
            .ticket-style .company-name {
              color: #f97316 !important;
            }
            
            @media print {
              * { 
                -webkit-print-color-adjust: exact !important; 
                color-adjust: exact !important; 
                print-color-adjust: exact !important; 
              }
              body { background: white !important; margin: 10px; }
              .grid { grid-template-columns: repeat(${columns}, 1fr); gap: 8px; }
              .card { max-width: ${isWideTemplate ? '240px' : '150px'}; padding: 12px; }
              .code-text { font-size: 18px; }
            }
          </style>
        </head>
        <body>
          <div class="${selectedTemplate}">
            <h1>Senhas do Plano: ${selectedPlan}</h1>
            <div class="footer">www.mikropix.online - Gerenciamento de Mikrotik na Nuvem</div>
            <div class="grid">
      `

      // Gerar cards individuais para cada usuário
      planUsers.forEach(user => {
        // Substituir variáveis nos valores das variáveis do template
        const processedVariables = { ...templateVariables }
        Object.entries(processedVariables).forEach(([key, value]) => {
          processedVariables[key] = value || ''
        })

        // Construir cada card baseado no template selecionado
        let cardContent = ''
        
        switch (selectedTemplate) {
          case 'wifi-classic':
            cardContent = `
              <div class="wifi-icon">📶</div>
              ${!removedFields.has('NOME_WIFI') ? `<div class="wifi-name">${processedVariables.NOME_WIFI || 'MikroPix-Guest'}</div>` : ''}
              <div class="code-container">
                ${!removedFields.has('TITULO_ACESSO') ? `<div class="code-label">${processedVariables.TITULO_ACESSO || 'USUÁRIO & SENHA'}</div>` : ''}
                <div class="code-text">${user.name}</div>
              </div>
            `
            break
            
          case 'business-premium':
            cardContent = `
              <div class="wifi-icon">⭐</div>
              ${!removedFields.has('EMPRESA') ? `<div class="company-name">${processedVariables.EMPRESA || 'MikroPix Telecom'}</div>` : ''}
              ${!removedFields.has('WHATSAPP') ? `<div class="whatsapp">📱 ${processedVariables.WHATSAPP || '(11) 99999-9999'}</div>` : ''}
              <div class="code-container">
                ${!removedFields.has('TITULO_ACESSO') ? `<div class="code-label">${processedVariables.TITULO_ACESSO || 'ACESSO WI-FI'}</div>` : ''}
                <div class="code-text">${user.name}</div>
              </div>
            `
            break
            
          case 'whatsapp-support':
            cardContent = `
              <div class="wifi-icon">💬</div>
              ${!removedFields.has('WHATSAPP') ? `<div class="contact">📱 ${processedVariables.WHATSAPP || '(11) 99999-9999'}</div>` : ''}
              ${!removedFields.has('WIFI_NAME') ? `<div class="wifi">📶 ${processedVariables.WIFI_NAME || 'MinhaRede'}</div>` : ''}
              <div class="code-container">
                ${!removedFields.has('TITULO_ACESSO') ? `<div class="code-label">${processedVariables.TITULO_ACESSO || 'LOGIN'}</div>` : ''}
                <div class="code-text">${user.name}</div>
              </div>
            `
            break
            
          case 'elegant-simple':
            cardContent = `
              <div class="icon">⭐</div>
              <div class="code-container">
                ${!removedFields.has('TITULO_ACESSO') ? `<div class="code-label">${processedVariables.TITULO_ACESSO || 'CÓDIGO DE ACESSO'}</div>` : ''}
                <div class="code-text">${user.name}</div>
              </div>
            `
            break
            
          case 'neon-cyber':
            cardContent = `
              <div class="icon">⚡</div>
              <div class="code-container">
                ${!removedFields.has('TITULO_ACESSO') ? `<div class="code-label">${processedVariables.TITULO_ACESSO || 'ACCESS CODE'}</div>` : ''}
                <div class="code-text">${user.name}</div>
              </div>
            `
            break

          case 'wide-classic':
            cardContent = `
              <div class="wifi-icon">🌐</div>
              ${!removedFields.has('EMPRESA') ? `<div class="company-name">${processedVariables.EMPRESA || 'MikroPix Telecom'}</div>` : ''}
              ${!removedFields.has('NOME_WIFI') ? `<div class="wifi-name">📶 ${processedVariables.NOME_WIFI || 'MikroPix-Guest'}</div>` : ''}
              ${!removedFields.has('WHATSAPP') ? `<div class="whatsapp">📱 ${processedVariables.WHATSAPP || '(11) 99999-9999'}</div>` : ''}
              ${!removedFields.has('ENDERECO') ? `<div class="address">📍 ${processedVariables.ENDERECO || 'Rua das Flores, 123 - Centro'}</div>` : ''}
              <div class="code-container">
                ${!removedFields.has('TITULO_ACESSO') ? `<div class="code-label">${processedVariables.TITULO_ACESSO || 'DADOS DE ACESSO'}</div>` : ''}
                <div class="code-text">${user.name}</div>
              </div>
            `
            break

          case 'wide-modern':
            cardContent = `
              <div class="wifi-icon">⭐</div>
              ${!removedFields.has('EMPRESA') ? `<div class="company-name">${processedVariables.EMPRESA || 'MikroPix Telecom'}</div>` : ''}
              ${!removedFields.has('SLOGAN') ? `<div class="slogan">${processedVariables.SLOGAN || 'Internet de qualidade para você!'}</div>` : ''}
              ${!removedFields.has('NOME_WIFI') ? `<div class="wifi-name">📶 ${processedVariables.NOME_WIFI || 'MikroPix-Guest'}</div>` : ''}
              ${!removedFields.has('WHATSAPP') ? `<div class="whatsapp">📱 ${processedVariables.WHATSAPP || '(11) 99999-9999'}</div>` : ''}
              ${!removedFields.has('SITE') ? `<div class="site">🌐 ${processedVariables.SITE || 'www.mikropix.online'}</div>` : ''}
              <div class="code-container">
                ${!removedFields.has('TITULO_ACESSO') ? `<div class="code-label">${processedVariables.TITULO_ACESSO || 'CREDENCIAIS DE ACESSO'}</div>` : ''}
                <div class="code-text">${user.name}</div>
              </div>
            `
            break

          case 'ticket-style':
            cardContent = `
              <div class="wifi-icon">🎫</div>
              ${!removedFields.has('ESTABELECIMENTO') ? `<div class="company-name">${processedVariables.ESTABELECIMENTO || 'Café & Wi-Fi MikroPix'}</div>` : ''}
              ${!removedFields.has('ENDERECO') ? `<div class="address">📍 ${processedVariables.ENDERECO || 'Rua das Flores, 123 - Centro'}</div>` : ''}
              ${!removedFields.has('TELEFONE') ? `<div class="phone">📞 ${processedVariables.TELEFONE || '(11) 3333-4444'}</div>` : ''}
              ${!removedFields.has('WHATSAPP') ? `<div class="whatsapp">📱 ${processedVariables.WHATSAPP || '(11) 99999-9999'}</div>` : ''}
              <div style="border-top: 1px dashed #ccc; padding-top: 8px; margin-top: 8px;">
                ${!removedFields.has('NOME_WIFI') ? `<div class="wifi">📶 ${processedVariables.NOME_WIFI || 'MikroPix-Guest'}</div>` : ''}
                ${!removedFields.has('TITULO_ACESSO') ? `<div class="code-label">${processedVariables.TITULO_ACESSO || 'ACESSO WI-FI GRATUITO'}</div>` : ''}
                <div class="code-container">
                  <div class="code-text">${user.name}</div>
                </div>
                ${!removedFields.has('VALIDADE') ? `<div class="validity">Válido por: ${processedVariables.VALIDADE || '24 horas'}</div>` : ''}
              </div>
            `
            break
            
          default:
            cardContent = `
              <div class="wifi-icon">📶</div>
              <div class="code-container">
                <div class="code-label">USUÁRIO</div>
                <div class="code-text">${user.name}</div>
              </div>
            `
        }
        
        finalHTML += `<div class="card">${cardContent}</div>`
      })
      
      finalHTML += `
            </div>
          </div>
        </body>
        </html>
      `
    }
    
    return finalHTML
  }

  // Abrir página de impressão
  const handlePrint = () => {
    const finalHTML = generateFinalHTML()
    
    // Criar nova aba com o conteúdo para impressão
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(finalHTML)
      newWindow.document.close()
      
      // Adicionar título na aba
      newWindow.document.title = `Senhas do Plano ${selectedPlan} - ${planUsers.length} usuários`
      
      // Aguardar carregamento completo e focar na nova aba
      setTimeout(() => {
        newWindow.focus()
        // Abrir diálogo de impressão automaticamente
        newWindow.print()
      }, 1000)
      
      // Fechar modal atual
      onClose()
    } else {
      alert('Não foi possível abrir a nova aba. Verifique se o bloqueador de pop-ups está desabilitado.')
    }
  }

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title="Imprimir Senhas">
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[
            { key: 'select-plan', label: 'Plano', icon: Users },
            { key: 'select-template', label: 'Template', icon: FileText },
            { key: 'preview', label: 'Preview', icon: Eye }
          ].map((stepItem, index) => {
            const isActive = step === stepItem.key
            const isCompleted = 
              (stepItem.key === 'select-plan' && ['select-template', 'preview'].includes(step)) ||
              (stepItem.key === 'select-template' && step === 'preview')
            
            return (
              <React.Fragment key={stepItem.key}>
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isActive ? 'bg-blue-600 text-white' :
                  isCompleted ? 'bg-green-600 text-white' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  <stepItem.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{stepItem.label}</span>
                </div>
                {index < 2 && (
                  <div className={`w-8 h-0.5 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Step 1: Selecionar Plano */}
        {step === 'select-plan' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Selecione o Plano</h3>
              <p className="text-gray-400 text-sm">
                Escolha o plano para filtrar usuários que nunca se conectaram (uptime = 0)
              </p>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {profiles.map((profile) => {
                const userCount = users.filter(u => 
                  u.profile === profile.name && 
                  (!u.uptime || u.uptime === '0' || u.uptime === '0s')
                ).length
                
                return (
                  <button
                    key={profile['.id']}
                    onClick={() => handlePlanSelect(profile.name)}
                    className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-800 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">{profile.name}</h4>
                        {profile['rate-limit'] && (
                          <p className="text-sm text-gray-400">{profile['rate-limit']}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-400">{userCount}</div>
                        <div className="text-xs text-gray-500">usuários</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Step 2: Selecionar Template */}
        {step === 'select-template' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Template de Senhas</h3>
                <p className="text-gray-400 text-sm">
                  {planUsers.length} usuários no plano "{selectedPlan}"
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('select-plan')}
                className="border-gray-700 text-gray-300"
              >
                Voltar
              </Button>
            </div>
            
            {/* Templates Grid */}
            <div className="grid grid-cols-2 gap-4">
              {currentTemplates.map((template) => {
                const IconComponent = template.icon
                return (
                  <div
                    key={template.id}
                    className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-blue-500 transition-all cursor-pointer"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color}`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <h5 className="font-medium text-white">{template.name}</h5>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                        Usar
                      </Button>
                    </div>
                    <div className="flex justify-center items-center" style={{ minHeight: '100px' }}>
                      <div 
                        className="border border-gray-600 rounded p-1 bg-white text-black text-xs overflow-hidden flex items-center justify-center"
                        style={{ height: '90px', width: '130px', transform: 'scale(0.8)' }}
                        dangerouslySetInnerHTML={{ __html: template.preview }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="border-gray-700 text-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-gray-400 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="border-gray-700 text-gray-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Template Personalizado */}
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-medium text-white">Template Personalizado</h5>
                  <p className="text-sm text-gray-400">Crie seu próprio template HTML</p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleCustomTemplate}
                  disabled={!customTemplate.trim() || isSavingTemplate}
                >
                  {isSavingTemplate ? 'Salvando...' : 'Usar'}
                </Button>
              </div>
              <textarea
                value={customTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
                className="w-full h-32 bg-black border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono"
                placeholder={isLoadingTemplate ? "Carregando template salvo..." : "Cole aqui seu HTML personalizado. Use {{USUARIO}} como variável."}
                disabled={isLoadingTemplate}
              />
              <p className="text-xs text-gray-500 mt-2">
                Use a variável: <code>{'{{USUARIO}}'}</code>
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Preview de Impressão</h3>
                <p className="text-gray-400 text-sm">
                  {planUsers.length} senhas do plano "{selectedPlan}" serão impressas
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('select-template')}
                className="border-gray-700 text-gray-300"
              >
                Voltar
              </Button>
            </div>
            
            {/* Template Variables */}
            {selectedTemplate !== 'custom' && (() => {
              const template = PASSWORD_TEMPLATES.find(t => t.id === selectedTemplate)
              return template?.variables && template.variables.length > 0 ? (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-white mb-3">Configurações do Template</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {template.variables.map((variable) => (
                      <div key={variable.key} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            {variable.label}
                          </label>
                          <input
                            type={variable.type}
                            value={templateVariables[variable.key] || variable.defaultValue}
                            onChange={(e) => setTemplateVariables(prev => ({
                              ...prev,
                              [variable.key]: e.target.value
                            }))}
                            disabled={removedFields.has(variable.key)}
                            className={`w-full border rounded px-3 py-2 text-sm ${
                              removedFields.has(variable.key) 
                                ? 'bg-gray-700 border-gray-600 text-gray-500' 
                                : 'bg-black border-gray-600 text-white'
                            }`}
                            placeholder={removedFields.has(variable.key) ? 'Campo removido' : variable.defaultValue}
                          />
                        </div>
                        {variable.removable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleFieldRemoval(variable.key)}
                            className={`mt-6 ${
                              removedFields.has(variable.key)
                                ? 'border-green-600 text-green-400 hover:bg-green-600'
                                : 'border-red-600 text-red-400 hover:bg-red-600'
                            }`}
                          >
                            {removedFields.has(variable.key) ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    💡 Use o botão lixeira para remover campos desnecessários ou o olho para restaurá-los
                  </p>
                </div>
              ) : null
            })()}
            
            {/* Preview Area */}
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-900">
              <h4 className="font-medium text-white mb-3">Preview</h4>
              <div className="flex justify-center">
                {(() => {
                  const user = planUsers[0]
                  if (!user) return <div className="text-gray-400">Nenhum usuário disponível</div>
                  
                  let previewHTML = selectedTemplate === 'custom' 
                    ? customTemplate 
                    : PASSWORD_TEMPLATES.find(t => t.id === selectedTemplate)?.preview || ''
                  
                  // Substituir variáveis do usuário
                  previewHTML = previewHTML.replace(/{{USUARIO}}/g, user.name)
                  previewHTML = previewHTML.replace(/{{SENHA}}/g, user.password || user.name)
                  
                  // Substituir variáveis personalizáveis com valores em tempo real
                  const template = PASSWORD_TEMPLATES.find(t => t.id === selectedTemplate)
                  if (template?.variables) {
                    template.variables.forEach(variable => {
                      const value = templateVariables[variable.key] || variable.defaultValue || ''
                      previewHTML = previewHTML.replace(new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g'), value)
                    })
                  }
                  
                  return (
                    <div 
                      className="border border-gray-600 rounded p-2 bg-white overflow-hidden"
                      style={{ minHeight: '150px', maxWidth: '300px' }}
                      dangerouslySetInnerHTML={{ __html: previewHTML }}
                    />
                  )
                })()}
              </div>
              <p className="text-center text-gray-400 text-sm mt-4">
                Este é um exemplo de como será impresso. Total: {planUsers.length} senhas
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-700 text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePrint}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir ({planUsers.length} senhas)
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </SimpleModal>
  )
}

export default PrintPasswordsModal