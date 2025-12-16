import { useEffect, useState } from 'react'
import { InvertedButton } from '@ui/InvertedButton'
import { Modal } from '@ui/Modal'
import { InputField } from '@ui/InputField'
import ConfirmModal from '@dashboard/ConfirmModal'

interface EditJobDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    companyName: string
    position: string
    dueDate: string
  }) => void
  onDelete: () => void
  initialData: {
    companyName: string
    position: string
    dueDate: string
  }
}

export default function EditJobModal({
  open,
  onClose,
  onSave,
  onDelete,
  initialData,
}: EditJobDialogProps) {
  const [companyName, setCompanyName] = useState(initialData.companyName)
  const [position, setPosition] = useState(initialData.position)
  const [dueDate, setDueDate] = useState(initialData.dueDate)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  useEffect(() => {
    if (open) {
      setCompanyName(initialData.companyName)
      setPosition(initialData.position)
      setDueDate(initialData.dueDate)
    }
  }, [open, initialData])

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        maxWidth="md"
        leftActions={
          <InvertedButton onClick={() => setShowConfirmDelete(true)}>
            Delete Application
          </InvertedButton>
        }
        actions={
          <>
            <InvertedButton onClick={onClose}>Cancel</InvertedButton>
            <InvertedButton
              onClick={() => onSave({ companyName, position, dueDate })}
            >
              Save
            </InvertedButton>
          </>
        }
      >
        <h3 className="mb-4 text-lg">Edit Job Application</h3>
        <div className="mb-6 space-y-6">
          <InputField
            id="companyName"
            label="Company Name"
            type="text"
            value={companyName}
            onChange={setCompanyName}
          />
          <InputField
            id="position"
            label="Position"
            type="text"
            value={position}
            onChange={setPosition}
          />
          <InputField
            id="dueDate"
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={setDueDate}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={() => {
          setShowConfirmDelete(false)
          onClose()
          onDelete()
        }}
        title="Delete Job Application?"
        message={`This will permanently delete the job application for ${companyName} - ${position}. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  )
}
