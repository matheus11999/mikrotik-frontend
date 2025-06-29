import React from 'react'
import { Button } from './ui/button'
import { X } from 'lucide-react'

interface SimpleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function SimpleModal({ isOpen, onClose, title, children }: SimpleModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800">
            <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:scale-110"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
} 