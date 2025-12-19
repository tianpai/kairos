import { useEffect, useState } from 'react'
import { Hammer } from 'lucide-react'
import { InvertedButton } from '@/components/ui/InvertedButton'
import BuilderModal from '@/components/resume-builder/BuilderModal'
import type { BuilderFormData } from '@/components/resume-builder/BuilderModal'
import { useCreateFromScratch } from '@/hooks/useCreateFromScratch'

interface BuilderButtonProps {
  onSuccess?: (jobId: string) => void
}

export default function BuilderButton({ onSuccess }: BuilderButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { handleSubmit, isPending, isSuccess, error, data } =
    useCreateFromScratch()

  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.'
    : null

  useEffect(() => {
    if (isSuccess && data) {
      setIsModalOpen(false)
      onSuccess?.(data.id)
    }
  }, [isSuccess, data, onSuccess])

  const handleClose = () => {
    if (!isPending) {
      setIsModalOpen(false)
    }
  }

  const handleModalSubmit = (formData: BuilderFormData) => {
    handleSubmit(formData)
  }

  return (
    <>
      <InvertedButton
        onClick={() => setIsModalOpen(true)}
        title="Build from scratch"
      >
        <div className="flex flex-row items-center gap-2">
          <Hammer size={16} />
          <span>BUILD</span>
        </div>
      </InvertedButton>

      <BuilderModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSubmit={handleModalSubmit}
        isSubmitting={isPending}
        errorMessage={errorMessage}
      />
    </>
  )
}
