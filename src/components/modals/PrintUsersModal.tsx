/**
 * 🖨️ Print Users Modal - Modal para impressão de vouchers WiFi
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Printer, 
  Download,
  FileText,
  Filter
} from 'lucide-react'

// Components
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface PrintUsersModalProps {
  isOpen: boolean
  onClose: () => void
  users: Array<{
    '.id': string
    name: string
    password?: string
    profile?: string
    comment?: string
    disabled?: string | boolean
  }>
  allUsers: Array<{
    '.id': string
    name: string
    password?: string
    profile?: string
    comment?: string
    disabled?: string | boolean
  }>
  profiles?: Array<{
    '.id': string
    name: string
    'rate-limit'?: string
  }>
}

interface PrintSettings {
  format: 'modelo1' | 'modelo2' | 'modelo3' | 'modelo4'
  selectedProfile: string
  title: string
}

const PrintUsersModal: React.FC<PrintUsersModalProps> = ({
  isOpen,
  onClose,
  users,
  allUsers,
  profiles = []
}) => {
  const [settings, setSettings] = useState<PrintSettings>({
    format: 'modelo1',
    selectedProfile: '',
    title: 'Vouchers WiFi'
  })

  const [usersToPrint, setUsersToPrint] = useState(users)

  // Update users when modal opens
  useEffect(() => {
    if (isOpen) {
      let usersToShow = users.length > 0 ? users : allUsers
      
      // Filter by profile if selected
      if (settings.selectedProfile) {
        usersToShow = usersToShow.filter(user => user.profile === settings.selectedProfile)
      }
      
      // Only active users
      usersToShow = usersToShow.filter(user => 
        user.disabled !== 'true' && user.disabled !== true
      )
      
      setUsersToPrint(usersToShow)
    }
  }, [isOpen, users, allUsers, settings.selectedProfile])

  // Generate print content
  const generatePrintContent = () => {
    const filteredUsers = usersToPrint

    if (settings.format === 'modelo1') {
      return generateModelo1(filteredUsers)
    } else if (settings.format === 'modelo2') {
      return generateModelo2(filteredUsers)
    } else if (settings.format === 'modelo3') {
      return generateModelo3(filteredUsers)
    } else {
      return generateModelo4(filteredUsers)
    }
  }

  // Modelo 1 - Simples
  const generateModelo1 = (usersList: any[]) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${settings.title}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          .container { display: flex; flex-wrap: wrap; gap: 10px; }
          .voucher { 
            border: 2px solid #333; 
            padding: 15px; 
            width: 3.5cm;
            height: 2.5cm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-inside: avoid;
            background: white;
            border-radius: 5px;
            margin-bottom: 10px;
          }
          .senha-label { font-size: 12px; color: #333; margin-bottom: 5px; font-weight: bold; }
          .senha { 
            font-size: 16px; 
            font-weight: bold; 
            color: #000; 
            padding: 4px;
            border-radius: 3px;
          }
          .row { display: flex; width: 100%; margin-bottom: 10px; }
          .row .voucher { margin-right: 10px; }
          .row .voucher:last-child { margin-right: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          ${usersList.map((user, index) => {
            const isStartOfRow = index % 5 === 0;
            const isEndOfRow = index % 5 === 4 || index === usersList.length - 1;
            return `
            ${isStartOfRow ? '<div class="row">' : ''}
              <div class="voucher">
                <div class="senha-label">SENHA</div>
                <div class="senha">${user.password || user.name}</div>
              </div>
            ${isEndOfRow ? '</div>' : ''}
            `;
          }).join('')}
        </div>
      </body>
      </html>
    `
  }

  // Modelo 2 - Colorido
  const generateModelo2 = (usersList: any[]) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${settings.title}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          .container { display: flex; flex-wrap: wrap; gap: 10px; }
          .voucher { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px; 
            width: 3.5cm;
            height: 2.5cm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-inside: avoid;
            border-radius: 10px;
            margin-bottom: 10px;
          }
          .senha-label { font-size: 12px; margin-bottom: 5px; opacity: 0.9; font-weight: bold; }
          .senha { 
            font-size: 16px; 
            font-weight: bold; 
            padding: 4px;
            border-radius: 5px;
          }
          .row { display: flex; width: 100%; margin-bottom: 10px; }
          .row .voucher { margin-right: 10px; }
          .row .voucher:last-child { margin-right: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          ${usersList.map((user, index) => {
            const isStartOfRow = index % 5 === 0;
            const isEndOfRow = index % 5 === 4 || index === usersList.length - 1;
            return `
            ${isStartOfRow ? '<div class="row">' : ''}
              <div class="voucher">
                <div class="senha-label">SENHA</div>
                <div class="senha">${user.password || user.name}</div>
              </div>
            ${isEndOfRow ? '</div>' : ''}
            `;
          }).join('')}
        </div>
      </body>
      </html>
    `
  }

  // Modelo 3 - Ticket
  const generateModelo3 = (usersList: any[]) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${settings.title}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body { font-family: 'Courier New', monospace; padding: 20px; background: white; }
          .container { display: flex; flex-wrap: wrap; gap: 10px; }
          .voucher { 
            border: 2px dashed #333;
            background: white;
            padding: 15px; 
            width: 3.2cm;
            height: 2.5cm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-inside: avoid;
            margin-bottom: 10px;
          }
          .senha-label { font-size: 10px; margin-bottom: 5px; font-weight: bold; }
          .senha { 
            font-size: 14px; 
            font-weight: bold; 
            border: 1px solid #333;
            padding: 4px;
          }
          .row { display: flex; width: 100%; margin-bottom: 10px; }
          .row .voucher { margin-right: 10px; }
          .row .voucher:last-child { margin-right: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          ${usersList.map((user, index) => {
            const isStartOfRow = index % 5 === 0;
            const isEndOfRow = index % 5 === 4 || index === usersList.length - 1;
            return `
            ${isStartOfRow ? '<div class="row">' : ''}
              <div class="voucher">
                <div class="senha-label">SENHA</div>
                <div class="senha">${user.password || user.name}</div>
              </div>
            ${isEndOfRow ? '</div>' : ''}
            `;
          }).join('')}
        </div>
      </body>
      </html>
    `
  }

  // Modelo 4 - Elegante
  const generateModelo4 = (usersList: any[]) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${settings.title}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body { font-family: 'Georgia', serif; padding: 20px; background: white; }
          .container { display: flex; flex-wrap: wrap; gap: 10px; }
          .voucher { 
            background: white;
            border: 2px solid #2c3e50;
            padding: 15px; 
            width: 3.5cm;
            height: 2.5cm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-inside: avoid;
            border-radius: 5px;
            margin-bottom: 10px;
          }
          .senha-label { 
            font-size: 12px; 
            margin-bottom: 5px; 
            color: #2c3e50; 
            font-weight: bold;
            text-transform: uppercase;
          }
          .senha { 
            font-size: 16px; 
            font-weight: bold; 
            color: #e74c3c;
            padding: 4px;
            border-radius: 3px;
          }
          .row { display: flex; width: 100%; margin-bottom: 10px; }
          .row .voucher { margin-right: 10px; }
          .row .voucher:last-child { margin-right: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          ${usersList.map((user, index) => {
            const isStartOfRow = index % 5 === 0;
            const isEndOfRow = index % 5 === 4 || index === usersList.length - 1;
            return `
            ${isStartOfRow ? '<div class="row">' : ''}
              <div class="voucher">
                <div class="senha-label">Senha</div>
                <div class="senha">${user.password || user.name}</div>
              </div>
            ${isEndOfRow ? '</div>' : ''}
            `;
          }).join('')}
        </div>
      </body>
      </html>
    `
  }

  // Handle print
  const handlePrint = () => {
    const printContent = generatePrintContent()
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    }
  }

  // Handle download
  const handleDownload = () => {
    const printContent = generatePrintContent()
    const blob = new Blob([printContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vouchers-${settings.format}-${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get unique profiles from users
  const getAvailableProfiles = () => {
    const profilesFromUsers = [...new Set(allUsers.map(user => user.profile).filter(Boolean))]
    return profilesFromUsers
  }

  // Generate preview samples
  const generatePreviewVouchers = () => {
    const sampleUsers = usersToPrint.slice(0, 4).length > 0 
      ? usersToPrint.slice(0, 4) 
      : [{ name: '12345', password: 'abc123' }, { name: '67890', password: 'def456' }]
    
    return sampleUsers
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <Card className="bg-black border-gray-800 p-0 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-gray-800 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Printer className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg lg:text-xl font-bold text-white">Imprimir Vouchers WiFi</h2>
                      <p className="text-sm text-gray-400">
                        {usersToPrint.length} voucher{usersToPrint.length !== 1 ? 's' : ''} para impressão
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col lg:flex-row">
                {/* Left Panel - Controls */}
                <div className="w-full lg:w-1/3 p-4 lg:p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-gray-800">
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Modelos de Voucher
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'modelo1', label: 'Simples' },
                        { value: 'modelo2', label: 'Colorido' },
                        { value: 'modelo3', label: 'Ticket' },
                        { value: 'modelo4', label: 'Elegante' }
                      ].map((format) => (
                        <button
                          key={format.value}
                          onClick={() => setSettings(prev => ({ ...prev, format: format.value as any }))}
                          className={`p-3 border rounded-lg cursor-pointer transition-all text-left ${
                            settings.format === format.value
                              ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                              : 'border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white'
                          }`}
                        >
                          <FileText className={`h-5 w-5 mb-1 ${
                            settings.format === format.value ? 'text-purple-400' : 'text-gray-500'
                          }`} />
                          <div className="text-sm font-medium">{format.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Profile Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Filter className="h-4 w-4 inline mr-1" />
                      Filtrar por Plano
                    </label>
                    <select
                      value={settings.selectedProfile}
                      onChange={(e) => setSettings(prev => ({ ...prev, selectedProfile: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="">Todos os planos</option>
                      {getAvailableProfiles().map((profile) => (
                        <option key={profile} value={profile}>
                          {profile}
                        </option>
                      ))}
                    </select>
                  </div>



                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={handlePrint}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={usersToPrint.length === 0}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download HTML
                    </Button>

                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="w-full"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>

                {/* Right Panel - Preview */}
                <div className="flex-1 p-4 lg:p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Preview do Modelo</h3>
                  
                  <div className="bg-white rounded-lg p-4 min-h-[400px] overflow-auto">
                    <div 
                      className="preview-container"
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          const previewUsers = generatePreviewVouchers()
                          if (settings.format === 'modelo1') {
                            return `
                              <style>
                                .voucher { 
                                  border: 2px solid #333; 
                                  padding: 15px; 
                                  margin: 10px;
                                  width: 150px;
                                  height: 100px;
                                  display: inline-block;
                                  text-align: center;
                                  background: white;
                                  border-radius: 5px;
                                  font-family: Arial, sans-serif;
                                }
                                .senha-label { font-size: 12px; color: #333; margin-bottom: 8px; font-weight: bold; }
                                .senha { 
                                  font-size: 14px; 
                                  font-weight: bold; 
                                  color: #000; 
                                  background: #f8f8f8;
                                  padding: 6px;
                                  border-radius: 5px;
                                  border: 1px solid #ddd;
                                }
                              </style>
                              ${previewUsers.map(user => `
                                <div class="voucher">
                                  <div class="senha-label">SENHA</div>
                                  <div class="senha">${user.password || user.name}</div>
                                </div>
                              `).join('')}
                            `
                          } else if (settings.format === 'modelo2') {
                            return `
                              <style>
                                .voucher { 
                                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                  color: white;
                                  padding: 15px; 
                                  margin: 10px;
                                  width: 150px;
                                  height: 100px;
                                  display: inline-block;
                                  text-align: center;
                                  border-radius: 10px;
                                  font-family: Arial, sans-serif;
                                }
                                .senha-label { font-size: 12px; margin-bottom: 8px; opacity: 0.9; font-weight: bold; }
                                .senha { 
                                  font-size: 14px; 
                                  font-weight: bold; 
                                  background: rgba(255,255,255,0.2);
                                  padding: 6px;
                                  border-radius: 8px;
                                }
                              </style>
                              ${previewUsers.map(user => `
                                <div class="voucher">
                                  <div class="senha-label">SENHA</div>
                                  <div class="senha">${user.password || user.name}</div>
                                </div>
                              `).join('')}
                            `
                          } else if (settings.format === 'modelo3') {
                            return `
                              <style>
                                .voucher { 
                                  border: 2px dashed #333;
                                  background: white;
                                  padding: 15px; 
                                  margin: 10px;
                                  width: 130px;
                                  height: 100px;
                                  display: inline-block;
                                  text-align: center;
                                  font-family: 'Courier New', monospace;
                                }
                                .senha-label { font-size: 10px; margin-bottom: 8px; font-weight: bold; }
                                .senha { 
                                  font-size: 12px; 
                                  font-weight: bold; 
                                  border: 1px solid #333;
                                  padding: 6px;
                                }
                              </style>
                              ${previewUsers.map(user => `
                                <div class="voucher">
                                  <div class="senha-label">SENHA</div>
                                  <div class="senha">${user.password || user.name}</div>
                                </div>
                              `).join('')}
                            `
                          } else {
                            return `
                              <style>
                                .voucher { 
                                  background: linear-gradient(to bottom, #ffffff, #f8f8f8);
                                  border: 2px solid #2c3e50;
                                  padding: 15px; 
                                  margin: 10px;
                                  width: 150px;
                                  height: 100px;
                                  display: inline-block;
                                  text-align: center;
                                  border-radius: 5px;
                                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                  font-family: 'Georgia', serif;
                                }
                                .senha-label { 
                                  font-size: 12px; 
                                  margin-bottom: 8px; 
                                  color: #2c3e50; 
                                  font-weight: bold;
                                  text-transform: uppercase;
                                }
                                .senha { 
                                  font-size: 14px; 
                                  font-weight: bold; 
                                  color: #e74c3c;
                                  background: #ecf0f1;
                                  padding: 6px;
                                  border-radius: 5px;
                                  border: 1px solid #bdc3c7;
                                }
                              </style>
                              ${previewUsers.map(user => `
                                <div class="voucher">
                                  <div class="senha-label">Senha</div>
                                  <div class="senha">${user.password || user.name}</div>
                                </div>
                              `).join('')}
                            `
                          }
                        })()
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PrintUsersModal