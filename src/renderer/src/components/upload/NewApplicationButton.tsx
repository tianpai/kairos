import { useEffect, useRef, useState } from 'react'
import { FilePlus } from 'lucide-react'
import type { JobApplicationInput } from '@/api/jobs'
import { getJobApplication } from '@/api/jobs'
import { InvertedButton } from '@/components/ui/InvertedButton'
import NewApplicationModal from '@/components/upload/NewApplicationModal'
import type { NewApplicationSubmitPayload } from '@/components/upload/NewApplicationModal'
import { useCreateJobApplication } from '@/hooks/useCreateJobApplication'
import { useCreateFromScratch } from '@/hooks/useCreateFromScratch'
import { useCreateFromExisting } from '@/hooks/useCreateFromExisting'
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

  // AI mode hook (with resume file upload)
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

  // Existing mode hook (copy resume from existing application)
  const {
    handleSubmit: handleFromExistingSubmit,
    isPending: isExistingPending,
    isSuccess: isExistingSuccess,
    error: existingError,
    data: existingData,
  } = useCreateFromExisting()

  const isPending = isAIPending || isScratchPending || isExistingPending
  const error = aiError || scratchError || existingError
  const isSuccess = isAISuccess || isScratchSuccess || isExistingSuccess
  const data = aiData || scratchData || existingData

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

    switch (payload.resumeSource) {
      case 'upload': {
        if (!payload.resumeFile) return
        try {
          const rawResumeContent = await extractResumeText(payload.resumeFile)
          const input: JobApplicationInput = {
            rawResumeContent,
            jobDescription: payload.jobDescription,
            companyName: payload.companyName,
            position: payload.position,
            dueDate: payload.dueDate,
            jobUrl: payload.jobUrl,
          }
          handleAISubmit(input)
        } catch {
          setExtractionError('Failed to read resume file. Please try again.')
        }
        break
      }

      case 'existing': {
        if (!payload.sourceJobId) return
        try {
          const sourceJob = await getJobApplication(payload.sourceJobId)
          if (!sourceJob.parsedResume) {
            setExtractionError('Source application has no parsed resume.')
            return
          }
          handleFromExistingSubmit(
            {
              sourceJobId: payload.sourceJobId,
              companyName: payload.companyName,
              position: payload.position,
              dueDate: payload.dueDate,
              jobDescription: payload.jobDescription,
              jobUrl: payload.jobUrl,
            },
            sourceJob.parsedResume,
          )
        } catch {
          setExtractionError('Failed to load source application.')
        }
        break
      }

      case 'scratch': {
        handleScratchSubmit({
          companyName: payload.companyName,
          position: payload.position,
          dueDate: payload.dueDate,
          jobDescription: payload.jobDescription || undefined,
          jobUrl: payload.jobUrl,
        })
        break
      }
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
