import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'fullscreen'

interface ModalProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  actions?: ReactNode
  leftActions?: ReactNode
  size?: ModalSize
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

function ModalFooter({
  actions,
  leftActions,
}: Pick<ModalProps, 'actions' | 'leftActions'>) {
  if (!actions && !leftActions) return null
  return (
    <div className="border-default flex justify-between border-t p-4">
      <div>{leftActions}</div>
      <div>{actions}</div>
    </div>
  )
}

function PopupModal({
  open,
  onClose,
  children,
  actions,
  leftActions,
  size = 'lg',
  closeOnBackdropClick = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeOnBackdropClick ? onClose : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={`flex max-h-[85vh] w-[90%] ${maxWidthClasses[size as keyof typeof maxWidthClasses]} bg-surface flex-col rounded-lg shadow-xl`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            <ModalFooter actions={actions} leftActions={leftActions} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function FullscreenModal({ open, children, actions, leftActions }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="bg-surface fixed inset-0 z-50 flex h-screen flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex-1 overflow-y-auto p-8">{children}</div>
          <ModalFooter actions={actions} leftActions={leftActions} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Modal(props: ModalProps) {
  const { open, onClose, size = 'fullscreen' } = props

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

  if (size !== 'fullscreen') {
    return <PopupModal {...props} />
  }

  return <FullscreenModal {...props} />
}
