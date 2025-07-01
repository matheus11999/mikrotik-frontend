import * as React from 'react'
import { ConfirmDialog } from '../components/ui/confirm-dialog'

interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  icon?: React.ReactNode
}

interface UseConfirmReturn {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  ConfirmComponent: React.ComponentType
}

export function useConfirm(): UseConfirmReturn {
  const [isOpen, setIsOpen] = React.useState(false)
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null)
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback((confirmOptions: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(confirmOptions)
      setIsOpen(true)
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = React.useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true)
      resolveRef.current = null
    }
    setIsOpen(false)
  }, [])

  const handleCancel = React.useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false)
      resolveRef.current = null
    }
    setIsOpen(false)
  }, [])

  const ConfirmComponent = React.useCallback(() => {
    if (!options) return null

    return (
      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel()
        }}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        icon={options.icon}
        onConfirm={handleConfirm}
      />
    )
  }, [isOpen, options, handleConfirm, handleCancel])

  return {
    confirm,
    ConfirmComponent
  }
}