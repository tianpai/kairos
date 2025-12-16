import { InvertedButton } from '@ui/InvertedButton'
import { Modal } from '@ui/Modal'

export interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      maxWidth="sm"
      actions={
        <>
          <InvertedButton type="button" onClick={onClose}>
            {cancelText}
          </InvertedButton>
          <InvertedButton type="button" onClick={onConfirm}>
            {confirmText}
          </InvertedButton>
        </>
      }
    >
      <h3>{title}</h3>
      <p className="my-6 text-sm">{message}</p>
    </Modal>
  )
}
