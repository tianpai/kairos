import { useEffect, useRef } from 'react'
import { FilePlus } from 'lucide-react'
import {
  EXTRACTING_PLACEHOLDER,
  getDefaultDueDate,
  useNewApplicationStore,
} from './newApplication.store'
import type { SubmitPayload } from './newApplication.store'
import { Button } from '@/components/ui/Button'
import NewApplicationModal from '@/components/upload/NewApplicationModal'
import { useCreateFromScratch } from '@/hooks/useCreateFromScratch'
import { useBatchCreation } from '@/hooks/useBatchCreation'
import { useHasApiKey } from '@/hooks/useSettings'
import { useShortcutStore } from '@/components/layout/shortcut.store'

interface NewApplicationButtonProps {
  onSuccess?: (jobId: string) => void
}

export default function NewApplicationButton({
  onSuccess,
}: NewApplicationButtonProps) {
  const handledJobIdRef = useRef<string | null>(null)
  const { data: hasApiKey } = useHasApiKey()

  // Store
  const isOpen = useNewApplicationStore((s) => s.isOpen)
  const openModal = useNewApplicationStore((s) => s.openModal)
  const closeModal = useNewApplicationStore((s) => s.closeModal)
  const setSubmissionError = useNewApplicationStore((s) => s.setSubmissionError)
  const submissionError = useNewApplicationStore((s) => s.submissionError)
  const batchProgress = useNewApplicationStore((s) => s.batchProgress)
  const reset = useNewApplicationStore((s) => s.reset)

  // Mutation hooks
  const {
    handleSubmit: handleScratchSubmit,
    isPending: isScratchPending,
    isSuccess: isScratchSuccess,
    error: scratchError,
    data: scratchData,
  } = useCreateFromScratch()
  const { handleBatchUpload, handleBatchExisting } = useBatchCreation()

  const isPending = isScratchPending || batchProgress.status === 'processing'
  const isSuccess = isScratchSuccess
  const data = scratchData

  // Keyboard shortcut
  const newApplicationRequested = useShortcutStore(
    (s) => s.newApplicationRequested,
  )
  const clearNewApplicationRequest = useShortcutStore(
    (s) => s.clearNewApplicationRequest,
  )

  useEffect(() => {
    if (newApplicationRequested) {
      openModal()
      clearNewApplicationRequest()
    }
  }, [newApplicationRequested, clearNewApplicationRequest, openModal])

  // Success handler
  useEffect(() => {
    if (isSuccess && data && data.id !== handledJobIdRef.current) {
      handledJobIdRef.current = data.id
      reset()
      onSuccess?.(data.id)
    }
  }, [isSuccess, data, onSuccess, reset])

  const errorMessage =
    submissionError ||
    (scratchError instanceof Error ? scratchError.message : null)

  async function handleSubmit(payload: SubmitPayload) {
    setSubmissionError(null)

    switch (payload.resumeSource) {
      case 'upload':
        if (payload.resumeFile) {
          await handleBatchUpload(payload.resumeFile, payload.entries)
        }
        break
      case 'existing':
        if (payload.sourceJobId) {
          await handleBatchExisting(payload.sourceJobId, payload.entries)
        }
        break
      case 'scratch': {
        const entry = payload.entries[0]
        const hasJd = entry.jobDescription.length > 0
        handleScratchSubmit({
          companyName: hasJd ? EXTRACTING_PLACEHOLDER : '',
          position: hasJd ? EXTRACTING_PLACEHOLDER : '',
          dueDate: getDefaultDueDate(),
          jobDescription: entry.jobDescription || undefined,
          jobUrl: entry.jobUrl,
        })
        break
      }
    }
  }

  return (
    <>
      <Button
        onClick={openModal}
        disabled={!hasApiKey}
        title={
          hasApiKey ? 'New application' : 'Configure API key in Settings first'
        }
      >
        <FilePlus size={16} />
      </Button>

      <NewApplicationModal
        isOpen={isOpen}
        onClose={() => !isPending && closeModal()}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        errorMessage={errorMessage}
      />
    </>
  )
}
