import { useEffect, useRef, useState } from 'react'
import { FilePlus } from 'lucide-react'
import type { JobApplicationInput } from '@/api/jobs'
import { InvertedButton } from '@/components/ui/InvertedButton'
import NewApplicationModal from '@/components/upload/NewApplicationModal'
import type { NewApplicationSubmitPayload } from '@/components/upload/NewApplicationModal'
import { useCreateJobApplication } from '@/hooks/useCreateJobApplication'
import { useCreateFromScratch } from '@/hooks/useCreateFromScratch'
import { useHasApiKey } from '@/hooks/useSettings'
import { extractResumeText } from '@/utils/resumeTextExtractor'
import { useShortcutStore } from '@/components/layout/shortcut.store'

interface NewApplicationButtonProps {
  onSuccess?: (jobId: string) => void
}

export default function NewApplicationButton({
  onSuccess,
}: NewApplicationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const handledJobIdRef = useRef<string | null>(null)

  const { data: hasApiKey } = useHasApiKey()

  // AI mode hook (with resume file)
  const {
    handleSubmit: handleAISubmit,
    isPending: isAIPending,
    isSuccess: isAISuccess,
    error: aiError,
    data: aiData,
  } = useCreateJobApplication()

  // Scratch mode hook (no resume file)
  const {
    handleSubmit: handleScratchSubmit,
    isPending: isScratchPending,
    isSuccess: isScratchSuccess,
    error: scratchError,
    data: scratchData,
  } = useCreateFromScratch()

  const isPending = isAIPending || isScratchPending
  const error = aiError || scratchError
  const isSuccess = isAISuccess || isScratchSuccess
  const data = aiData || scratchData

  // Listen for keyboard shortcut to open modal
  const newApplicationRequested = useShortcutStore(
    (state) => state.newApplicationRequested,
  )
  const clearNewApplicationRequest = useShortcutStore(
    (state) => state.clearNewApplicationRequest,
  )

  useEffect(() => {
    if (newApplicationRequested) {
      setIsModalOpen(true)
      clearNewApplicationRequest()
    }
  }, [newApplicationRequested, clearNewApplicationRequest])

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

  const handleModalSubmit = async (payload: NewApplicationSubmitPayload) => {
    setExtractionError(null)

    if (payload.resumeFile) {
      // AI mode - extract text and submit with resume
      try {
        const rawResumeContent = await extractResumeText(payload.resumeFile)
        const input: JobApplicationInput = {
          rawResumeContent,
          jobDescription: payload.jobDescription,
          companyName: payload.companyName,
          position: payload.position,
          dueDate: payload.dueDate,
        }
        handleAISubmit(input)
      } catch {
        setExtractionError('Failed to read resume file. Please try again.')
      }
    } else {
      // Scratch mode - submit without resume
      handleScratchSubmit({
        companyName: payload.companyName,
        position: payload.position,
        dueDate: payload.dueDate,
        jobDescription: payload.jobDescription || undefined,
      })
    }
  }

  return (
    <>
      <InvertedButton
        onClick={() => setIsModalOpen(true)}
        disabled={!hasApiKey}
        title={
          hasApiKey ? 'New application' : 'Configure API key in Settings first'
        }
      >
        <FilePlus size={16} />
      </InvertedButton>

      <NewApplicationModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSubmit={handleModalSubmit}
        isSubmitting={isPending}
        errorMessage={errorMessage}
      />
    </>
  )
}
