import { Plus } from 'lucide-react'
import { useNewApplicationStore } from './newApplication.store'
import type { SubmitPayload } from './newApplication.store'
import { Button } from '@/components/ui/Button'
import NewApplicationModal from '@/components/upload/NewApplicationModal'
import { useHasActiveProviderApiKey } from '@/hooks/useSettings'
import { useWorkflow } from '@/hooks/useWorkflow'

export default function NewApplicationButton() {
  const { data: hasApiKey } = useHasActiveProviderApiKey()

  const isOpen = useNewApplicationStore((s) => s.isOpen)
  const openModal = useNewApplicationStore((s) => s.openModal)
  const closeModal = useNewApplicationStore((s) => s.closeModal)
  const batchProgress = useNewApplicationStore((s) => s.batchProgress)

  const { createApplications } = useWorkflow()

  const isPending = batchProgress.status === 'processing'

  async function handleSubmit(payload: SubmitPayload) {
    if (!hasApiKey) return
    await createApplications(payload)
  }

  return (
    <>
      <Button
        onClick={openModal}
        disabled={!hasApiKey}
        tooltip={
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
