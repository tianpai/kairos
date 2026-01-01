import { InvertedButton } from '@ui/InvertedButton'
import { Modal } from '@ui/Modal'
import { useNewApplicationStore } from './newApplication.store'
import type { SubmitPayload } from './newApplication.store'
import ResumeUploadSection from '@/components/upload/ResumeUploadSection'
import JobDetailsSection from '@/components/upload/JobDetailsSection'
import { ResumeSourceSelector } from '@/components/upload/ResumeSourceSelector'
import { ExistingApplicationSelect } from '@/components/upload/ExistingApplicationSelect'

interface NewApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: SubmitPayload) => void
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
  const resumeSource = useNewApplicationStore((s) => s.resumeSource)
  const setResumeSource = useNewApplicationStore((s) => s.setResumeSource)
  const selectedFile = useNewApplicationStore((s) => s.selectedFile)
  const setSelectedFile = useNewApplicationStore((s) => s.setSelectedFile)
  const selectedSourceId = useNewApplicationStore((s) => s.selectedSourceId)
  const setSelectedSourceId = useNewApplicationStore(
    (s) => s.setSelectedSourceId,
  )
  const canSubmit = useNewApplicationStore((s) => s.canSubmit)
  const buildPayload = useNewApplicationStore((s) => s.buildPayload)
  const entries = useNewApplicationStore((s) => s.entries)

  const entryCount = entries.length

  function handleSubmit() {
    if (isSubmitting) return
    const payload = buildPayload()
    if (payload) onSubmit(payload)
  }

  const buttonText =
    entryCount > 1 ? `Create ${entryCount} applications` : 'Create application'

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
            disabled={!canSubmit()}
            loading={isSubmitting}
          >
            {buttonText}
          </InvertedButton>
        </>
      }
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        <h1 className="text-lg font-semibold">New Application</h1>

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

        <JobDetailsSection requireJobDescription={resumeSource !== 'scratch'} />
      </div>

      {errorMessage && (
        <p className="mt-4 text-center text-sm text-rose-500">{errorMessage}</p>
      )}
    </Modal>
  )
}
