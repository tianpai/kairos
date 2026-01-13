import { Button } from '@ui/Button'
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
  hasApiKey?: boolean
}

export default function NewApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  hasApiKey = true,
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

  const filledEntryCount = entries.filter(
    (entry) => entry.jobDescription.trim().length > 0,
  ).length
  const entryCount = Math.max(1, filledEntryCount)

  function handleSubmit() {
    if (isSubmitting || !hasApiKey) return
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
      maxWidth="2xl"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasApiKey || !canSubmit()}
            loading={isSubmitting}
          >
            {buttonText}
          </Button>
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

        <JobDetailsSection />
      </div>

    </Modal>
  )
}
