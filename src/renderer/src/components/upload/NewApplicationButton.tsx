import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useNewApplicationStore } from './newApplication.store'
import type { SubmitPayload } from './newApplication.store'
import { Button } from '@/components/ui/Button'
import NewApplicationModal from '@/components/upload/NewApplicationModal'
import { useBatchCreation } from '@/hooks/useBatchCreation'
import { useHasApiKey } from '@/hooks/useSettings'
import { useShortcutStore } from '@/components/layout/shortcut.store'

export default function NewApplicationButton() {
  const { data: hasApiKey } = useHasApiKey()

  // Store
  const isOpen = useNewApplicationStore((s) => s.isOpen)
  const openModal = useNewApplicationStore((s) => s.openModal)
  const closeModal = useNewApplicationStore((s) => s.closeModal)
  const batchProgress = useNewApplicationStore((s) => s.batchProgress)

  // Mutation hooks
  const { handleBatchUpload, handleBatchExisting } = useBatchCreation()

  const isPending = batchProgress.status === 'processing'

  // Keyboard shortcut
  const newApplicationRequested = useShortcutStore(
    (s) => s.newApplicationRequested,
  )
  const clearNewApplicationRequest = useShortcutStore(
    (s) => s.clearNewApplicationRequest,
  )

  useEffect(() => {
    if (!newApplicationRequested) return
    if (hasApiKey) {
      openModal()
    }
    clearNewApplicationRequest()
  }, [
    newApplicationRequested,
    hasApiKey,
    clearNewApplicationRequest,
    openModal,
  ])

  async function handleSubmit(payload: SubmitPayload) {
    if (!hasApiKey) return
    if (payload.resumeSource === 'upload' && payload.rawResumeContent) {
      await handleBatchUpload(payload.rawResumeContent, payload.entries)
    } else if (payload.resumeSource === 'existing' && payload.sourceJobId) {
      await handleBatchExisting(payload.sourceJobId, payload.entries)
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
        <Plus size={16} />
      </Button>

      <NewApplicationModal
        isOpen={isOpen}
        onClose={() => !isPending && closeModal()}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        hasApiKey={!!hasApiKey}
      />
    </>
  )
}
