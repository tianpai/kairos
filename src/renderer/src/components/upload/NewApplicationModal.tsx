import { useEffect, useState } from 'react'
import { InvertedButton } from '@ui/InvertedButton'
import { Modal } from '@ui/Modal'
import { Toggle } from '@ui/Toggle'
import type { JobApplicationFormData } from '@/components/upload/JobDetailsSection'
import ResumeUploadSection from '@/components/upload/ResumeUploadSection'
import JobDetailsSection from '@/components/upload/JobDetailsSection'

export interface NewApplicationSubmitPayload {
  resumeFile?: File
  jobDescription: string
  companyName: string
  position: string
  dueDate: string
}

interface NewApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: NewApplicationSubmitPayload) => void
  isSubmitting?: boolean
  errorMessage?: string | null
}

export default function NewApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}: NewApplicationModalProps) {
  const [useAI, setUseAI] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jobFormData, setJobFormData] = useState<JobApplicationFormData | null>(
    null,
  )
  const [isJobFormValid, setIsJobFormValid] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setUseAI(true)
      setSelectedFile(null)
      setJobFormData(null)
      setIsJobFormValid(false)
    }
  }, [isOpen])

  function handleJobFormChange(
    formData: JobApplicationFormData,
    isValid: boolean,
  ) {
    setJobFormData(formData)
    setIsJobFormValid(isValid)
  }

  function handleSubmit() {
    if (!jobFormData || !isJobFormValid || isSubmitting) {
      return
    }

    if (useAI && !selectedFile) {
      return
    }

    onSubmit({
      resumeFile: useAI ? (selectedFile ?? undefined) : undefined,
      ...jobFormData,
    })
  }

  const canSubmit = useAI
    ? Boolean(selectedFile && isJobFormValid)
    : isJobFormValid

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      variant="popup"
      maxWidth="xl"
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
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">New Application</h1>
          <Toggle
            checked={useAI}
            onChange={setUseAI}
            labelOff="Build from scratch"
            labelOn="Use AI"
          />
        </div>

        {useAI && (
          <ResumeUploadSection
            selectedFile={selectedFile}
            onFileChange={setSelectedFile}
          />
        )}

        <JobDetailsSection
          onFormChange={handleJobFormChange}
          requireJobDescription={useAI}
        />
      </div>

      {errorMessage && (
        <p className="mt-4 text-center text-sm text-rose-500">{errorMessage}</p>
      )}
    </Modal>
  )
}
