import { useEffect, useState } from 'react'
import { Button } from '@ui/Button'
import { Modal } from '@ui/Modal'
import { InputField } from '@ui/InputField'
import { HoldButton } from '@ui/HoldButton'
import { normalizeUrl } from '@utils/format'

interface JobInfoModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    companyName: string
    position: string
    dueDate: string
    jobUrl: string | null
  }) => void
  onDelete: () => void
  initialData: {
    companyName: string
    position: string
    dueDate: string
    jobUrl: string | null
  }
}

export default function JobInfoModal({
  open,
  onClose,
  onSave,
  onDelete,
  initialData,
}: JobInfoModalProps) {
  const [companyName, setCompanyName] = useState(initialData.companyName)
  const [position, setPosition] = useState(initialData.position)
  const [dueDate, setDueDate] = useState(initialData.dueDate)
  const [jobUrl, setJobUrl] = useState(initialData.jobUrl ?? '')

  useEffect(() => {
    if (open) {
      setCompanyName(initialData.companyName)
      setPosition(initialData.position)
      setDueDate(initialData.dueDate)
      setJobUrl(initialData.jobUrl ?? '')
    }
  }, [open, initialData])

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      leftActions={
        <HoldButton
          onComplete={() => {
            onClose()
            onDelete()
          }}
          className="text-error hover:bg-hover"
        >
          Hold to Delete
        </HoldButton>
      }
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={() =>
              onSave({
                companyName,
                position,
                dueDate,
                jobUrl: normalizeUrl(jobUrl),
              })
            }
          >
            Save
          </Button>
        </>
      }
    >
      <h3 className="mb-4 text-lg">Job Info</h3>
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
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <InputField
              id="jobUrl"
              label="Job URL"
              type="text"
              value={jobUrl}
              onChange={setJobUrl}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
