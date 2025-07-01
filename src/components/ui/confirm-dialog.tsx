import * as React from "react"
import { AlertTriangle, Check, X } from "lucide-react"
import { Modal, ModalFooter, ModalContent } from "./modal"
import { Button } from "./button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  loading?: boolean
  onConfirm: () => void | Promise<void>
  icon?: React.ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar", 
  variant = "default",
  loading = false,
  onConfirm,
  icon
}: ConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleConfirm = async () => {
    try {
      setIsProcessing(true)
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Error in confirm action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const defaultIcon = variant === "destructive" ? (
    <AlertTriangle className="h-6 w-6 text-red-400" />
  ) : (
    <Check className="h-6 w-6 text-blue-400" />
  )

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      closeOnOverlayClick={!isProcessing && !loading}
    >
      <ModalContent>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 p-3 rounded-full bg-gray-900 border border-gray-800">
            {icon || defaultIcon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-2">
              {title}
            </h3>
            
            {description && (
              <p className="text-gray-400 text-sm">
                {description}
              </p>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing || loading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            {cancelText}
          </Button>
          
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isProcessing || loading}
            className="flex-1"
          >
            {(isProcessing || loading) ? (
              <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}