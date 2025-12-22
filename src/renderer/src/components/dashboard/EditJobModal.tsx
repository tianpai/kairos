import { useEffect, useState } from 'react'
import { InvertedButton } from '@ui/InvertedButton'
import { Modal } from '@ui/Modal'
import { InputField } from '@ui/InputField'
import { HoldButton } from '@ui/HoldButton'

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

  useEffect(() => {
    if (open) {
      setCompanyName(initialData.companyName)
      setPosition(initialData.position)
      setDueDate(initialData.dueDate)
    }
  }, [open, initialData])

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="md"
      leftActions={
        <HoldButton
          onComplete={() => {
            onClose()
            onDelete()
          }}
          className="text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          Hold to Delete
        </HoldButton>
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
  )
}
