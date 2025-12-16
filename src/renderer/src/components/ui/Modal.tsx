import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  actions?: ReactNode
  leftActions?: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({
  open,
  onClose,
  children,
  actions,
  leftActions,
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

  return (
    <div className="fixed inset-0 z-50 flex h-screen flex-col bg-[#fafafa] dark:bg-[#1a1a1a]">
      <div className="flex-1 overflow-y-auto p-8">{children}</div>
      {(actions || leftActions) && (
        <div className="flex justify-between border-t border-gray-200 p-4 dark:border-gray-700">
          <div>{leftActions}</div>
          <div>{actions}</div>
        </div>
      )}
    </div>
  )
}
