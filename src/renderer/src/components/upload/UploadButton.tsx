import { useEffect, useRef, useState } from 'react'
import { FilePlus } from 'lucide-react'
import type { JobApplicationInput } from '@/api/jobs'
import { InvertedButton } from '@/components/ui/InvertedButton'
import UploadModal from '@/components/upload/UploadModal'
import { useCreateJobApplication } from '@/hooks/useCreateJobApplication'
import { useHasApiKey } from '@/hooks/useSettings'
import { extractResumeText } from '@/utils/resumeTextExtractor'
import { useShortcutStore } from '@/components/layout/shortcut.store'

export interface UploadModalSubmitPayload {
  resumeFile: File
  jobDescription: string
  companyName: string
  position: string
  dueDate: string
}

interface UploadButtonProps {
  onSuccess?: (jobId: string) => void
}

export default function UploadButton({ onSuccess }: UploadButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const handledJobIdRef = useRef<string | null>(null)

  const { data: hasApiKey } = useHasApiKey()
  const { handleSubmit, isPending, isSuccess, error, data } =
    useCreateJobApplication()

  // Listen for keyboard shortcut to open modal
  const newApplicationRequested = useShortcutStore(
    (state) => state.newApplicationRequested,
  )
  const clearNewApplicationRequest = useShortcutStore(
    (state) => state.clearNewApplicationRequest,
  )

  useEffect(() => {
    if (newApplicationRequested) {
      // Only open modal if API key is configured
      if (hasApiKey) {
        setIsModalOpen(true)
      }
      clearNewApplicationRequest()
    }
  }, [newApplicationRequested, clearNewApplicationRequest, hasApiKey])

  const errorMessage =
    extractionError ||
    (error
      ? error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.'
      : null)

  useEffect(() => {
    if (isSuccess && data && data.id !== handledJobIdRef.current) {
      handledJobIdRef.current = data.id
      setIsModalOpen(false)
      onSuccess?.(data.id)
    }
  }, [isSuccess, data, onSuccess])

  const handleClose = () => {
    if (!isPending) {
      setIsModalOpen(false)
      setExtractionError(null)
    }
  }

  const handleModalSubmit = async (payload: UploadModalSubmitPayload) => {
    setExtractionError(null)

    try {
      const rawResumeContent = await extractResumeText(payload.resumeFile)
      const input: JobApplicationInput = {
        rawResumeContent,
        jobDescription: payload.jobDescription,
        companyName: payload.companyName,
        position: payload.position,
        dueDate: payload.dueDate,
      }
      handleSubmit(input)
    } catch (err) {
      setExtractionError('Failed to read resume file. Please try again.')
    }
  }

  return (
    <>
      <InvertedButton
        onClick={() => setIsModalOpen(true)}
        disabled={!hasApiKey}
        title={hasApiKey ? 'New application' : 'Configure API key in Settings first'}
      >
        <div className="flex flex-row items-center gap-2">
          <FilePlus size={16} />
          <span>NEW</span>
        </div>
      </InvertedButton>

      <UploadModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSubmit={handleModalSubmit}
        isSubmitting={isPending}
        errorMessage={errorMessage}
      />
    </>
  )
}
