import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  actions?: ReactNode
  leftActions?: ReactNode
  variant?: 'fullscreen' | 'popup'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  closeOnBackdropClick?: boolean
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
}

export function Modal({
  open,
  onClose,
  children,
  actions,
  leftActions,
  variant = 'fullscreen',
  maxWidth = 'lg',
  closeOnBackdropClick = true,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }

    if (open) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  if (variant === 'popup') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={closeOnBackdropClick ? onClose : undefined}
      >
        <div
          className={`flex max-h-[85vh] w-[90%] ${maxWidthClasses[maxWidth]} flex-col rounded-lg bg-surface shadow-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
          {(actions || leftActions) && (
            <div className="flex justify-between border-t border-default p-4">
              <div>{leftActions}</div>
              <div>{actions}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen flex-col bg-surface">
      <div className="flex-1 overflow-y-auto p-8">{children}</div>
      {(actions || leftActions) && (
        <div className="flex justify-between border-t border-default p-4">
          <div>{leftActions}</div>
          <div>{actions}</div>
        </div>
      )}
    </div>
  )
}
