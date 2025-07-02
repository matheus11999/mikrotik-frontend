import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg", 
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-7xl"
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true
}: ModalProps) {
  // Fechar modal com ESC e prevenir scroll
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <AnimatePresence>
      <>
        {/* Overlay cobrindo toda a página */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
          onClick={closeOnOverlayClick ? () => onOpenChange(false) : undefined}
        />

        {/* Wrapper para centralizar o conteúdo */}
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative z-10 w-full max-h-[90vh] overflow-auto pointer-events-auto",
              "bg-black border border-gray-700 rounded-2xl shadow-2xl",
              "flex flex-col",
              sizeClasses[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                  {title && (
                    <h2 className="text-xl font-bold text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-gray-400 mt-1 text-sm">
                      {description}
                    </p>
                  )}
                </div>
                
                {showCloseButton && (
                  <button
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    aria-label="Fechar modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={cn(
              "p-6",
              !title && !showCloseButton && "pt-6"
            )}>
              {children}
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  )
}

// Modal Footer Component
interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 pt-6 border-t border-gray-800",
      className
    )}>
      {children}
    </div>
  )
}

// Modal Content Component (for custom layout)
interface ModalContentProps {
  children: React.ReactNode
  className?: string
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  )
}