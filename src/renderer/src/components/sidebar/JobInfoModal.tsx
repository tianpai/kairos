import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@ui/Button'
import { Modal } from '@ui/Modal'
import { InputField } from '@ui/InputField'
import { HoldButton } from '@ui/HoldButton'

function normalizeUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

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
      variant="popup"
      maxWidth="md"
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
              type="url"
              value={jobUrl}
              onChange={setJobUrl}
              placeholder="https://..."
            />
          </div>
          {jobUrl.trim() && (
            <button
              type="button"
              onClick={() => {
                const url = normalizeUrl(jobUrl)
                if (url) window.kairos.shell.openExternal(url)
              }}
              className="text-hint hover:bg-hover hover:text-primary mb-0.5 rounded p-2 transition-colors"
              title="Open in browser"
            >
              <ExternalLink size={18} />
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
