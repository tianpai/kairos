import { useEffect, useState } from 'react'
import { InvertedButton } from '@ui/InvertedButton'
import { Modal } from '@ui/Modal'
import type { UploadModalSubmitPayload } from './UploadButton'
import type { JobApplicationFormData } from '@/components/upload/JobDetailsSection'
import ResumeUploadSection from '@/components/upload/ResumeUploadSection'
import JobDetailsSection from '@/components/upload/JobDetailsSection'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: UploadModalSubmitPayload) => void
  isSubmitting?: boolean
  errorMessage?: string | null
}

export default function UploadModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jobFormData, setJobFormData] = useState<JobApplicationFormData | null>(
    null,
  )
  const [isJobFormValid, setIsJobFormValid] = useState(false)

  useEffect(() => {
    if (!isOpen) {
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
    if (!selectedFile || !jobFormData || !isJobFormValid || isSubmitting) {
      return
    }

    onSubmit({
      resumeFile: selectedFile,
      ...jobFormData,
    })
  }

  const canSubmit = Boolean(selectedFile && isJobFormValid)

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
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
      <div className="mx-auto grid h-full max-w-5xl grid-cols-2 gap-10">
        <ResumeUploadSection
          selectedFile={selectedFile}
          onFileChange={setSelectedFile}
        />
        <JobDetailsSection onFormChange={handleJobFormChange} />
      </div>

      {errorMessage && (
        <p className="mt-2 text-sm text-rose-500">{errorMessage}</p>
      )}
    </Modal>
  )
}
