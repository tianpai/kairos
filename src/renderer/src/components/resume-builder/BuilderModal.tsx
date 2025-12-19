import { useEffect, useState } from 'react'
import { InvertedButton } from '@ui/InvertedButton'
import { Modal } from '@ui/Modal'
import { InputField } from '@ui/InputField'
import { DatePicker } from '@ui/DatePicker'

export interface BuilderFormData {
  companyName: string
  position: string
  dueDate: string
  jobDescription?: string
}

interface BuilderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BuilderFormData) => void
  isSubmitting?: boolean
  errorMessage?: string | null
}

export default function BuilderModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}: BuilderModalProps) {
  const [companyName, setCompanyName] = useState('')
  const [position, setPosition] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setCompanyName('')
      setPosition('')
      setDueDate('')
      setJobDescription('')
    }
  }, [isOpen])

  function handleSubmit() {
    if (!companyName.trim() || !position.trim() || !dueDate || isSubmitting) {
      return
    }

    onSubmit({
      companyName: companyName.trim(),
      position: position.trim(),
      dueDate,
      jobDescription: jobDescription.trim() || undefined,
    })
  }

  const canSubmit = Boolean(companyName.trim() && position.trim() && dueDate)

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      actions={
        <>
          <InvertedButton onClick={onClose}>Cancel</InvertedButton>
          <InvertedButton
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={isSubmitting}
          >
            Create application
          </InvertedButton>
        </>
      }
    >
      <div className="mx-auto max-w-xl">
        <h2 className="text-lg font-semibold">Build from scratch</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a new resume without uploading an existing one.
        </p>

        <div className="mt-6 flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="companyName"
              label="Company"
              type="text"
              value={companyName}
              onChange={setCompanyName}
              placeholder="Google, Apple, etc."
            />
            <InputField
              id="position"
              label="Position"
              type="text"
              value={position}
              onChange={setPosition}
              placeholder="Software Engineer"
            />
          </div>

          <DatePicker
            id="dueDate"
            label="Application Due Date"
            value={dueDate}
            onChange={setDueDate}
            disablePastDates
          />

          <div className="flex flex-col">
            <label
              htmlFor="jobDescription"
              className="mb-1 block text-sm font-medium"
            >
              Job Description{' '}
              <span className="text-gray-400 dark:text-gray-500">
                (optional)
              </span>
            </label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the job description here to enable AI tailoring later..."
              className="mt-1 min-h-[12rem] w-full resize-none border-b border-gray-300 bg-transparent p-3 leading-relaxed text-slate-800 outline-none focus:border-black dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-white"
            />
          </div>
        </div>

        {errorMessage && (
          <p className="mt-4 text-sm text-rose-500">{errorMessage}</p>
        )}
      </div>
    </Modal>
  )
}
