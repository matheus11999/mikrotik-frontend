import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-400" />
      default:
        return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-600/50'
      case 'error':
        return 'border-red-600/50'
      case 'warning':
        return 'border-yellow-600/50'
      case 'info':
        return 'border-blue-600/50'
      default:
        return 'border-blue-600/50'
    }
  }

  return (
    <div className={cn(
      'bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-80 shadow-lg',
      getBorderColor(),
      'animate-in slide-in-from-right-full duration-300'
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white">
            {toast.title}
          </h4>
          {toast.description && (
            <p className="text-sm text-gray-400 mt-1">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Helper functions for easy use
export const toast = {
  success: (_title: string, _description?: string, _duration?: number) => {
    // This will be replaced by the hook in components
  },
  error: (_title: string, _description?: string, _duration?: number) => {
    // This will be replaced by the hook in components
  },
  warning: (_title: string, _description?: string, _duration?: number) => {
    // This will be replaced by the hook in components
  },
  info: (_title: string, _description?: string, _duration?: number) => {
    // This will be replaced by the hook in components
  }
}