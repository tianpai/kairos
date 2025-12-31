import { useEffect, useState } from 'react'
import { InvertedButton } from '@ui/InvertedButton'
import { Modal } from '@ui/Modal'
import type { JobApplicationFormData } from '@/components/upload/JobDetailsSection'
import ResumeUploadSection from '@/components/upload/ResumeUploadSection'
import JobDetailsSection from '@/components/upload/JobDetailsSection'
import {
  ResumeSourceSelector,
  type ResumeSource,
} from '@/components/upload/ResumeSourceSelector'
import { ExistingApplicationSelect } from '@/components/upload/ExistingApplicationSelect'

export interface NewApplicationSubmitPayload {
  resumeSource: ResumeSource
  resumeFile?: File
  sourceJobId?: string
  jobDescription: string
  companyName: string
  position: string
  dueDate: string
  jobUrl?: string
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
  const [resumeSource, setResumeSource] = useState<ResumeSource>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [jobFormData, setJobFormData] = useState<JobApplicationFormData | null>(
    null,
  )
  const [isJobFormValid, setIsJobFormValid] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setResumeSource('upload')
      setSelectedFile(null)
      setSelectedSourceId(null)
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

    if (resumeSource === 'upload' && !selectedFile) {
      return
    }

    if (resumeSource === 'existing' && !selectedSourceId) {
      return
    }

    onSubmit({
      resumeSource,
      resumeFile: resumeSource === 'upload' ? (selectedFile ?? undefined) : undefined,
      sourceJobId: resumeSource === 'existing' ? (selectedSourceId ?? undefined) : undefined,
      ...jobFormData,
    })
  }

  const canSubmit = (() => {
    if (!isJobFormValid) return false
    switch (resumeSource) {
      case 'upload':
        return Boolean(selectedFile)
      case 'existing':
        return Boolean(selectedSourceId)
      case 'scratch':
        return true
    }
  })()

  // Job description is required for upload and existing modes (AI needs it)
  const requireJobDescription = resumeSource !== 'scratch'

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
        </div>

        <ResumeSourceSelector value={resumeSource} onChange={setResumeSource} />

        {resumeSource === 'upload' && (
          <ResumeUploadSection
            selectedFile={selectedFile}
            onFileChange={setSelectedFile}
          />
        )}

        {resumeSource === 'existing' && (
          <ExistingApplicationSelect
            value={selectedSourceId}
            onChange={setSelectedSourceId}
          />
        )}

        <JobDetailsSection
          onFormChange={handleJobFormChange}
          requireJobDescription={requireJobDescription}
        />
      </div>

      {errorMessage && (
        <p className="mt-4 text-center text-sm text-rose-500">{errorMessage}</p>
      )}
    </Modal>
  )
}
