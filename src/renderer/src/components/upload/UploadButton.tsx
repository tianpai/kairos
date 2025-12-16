import { useEffect, useState } from 'react'
import { FilePlus } from 'lucide-react'
import type { JobApplicationInput } from '@/api/jobs'
import { InvertedButton } from '@/components/ui/InvertedButton'
import UploadModal from '@/components/upload/UploadModal'
import { useCreateJobApplication } from '@/hooks/useCreateJobApplication'
import { extractResumeText } from '@/utils/resumeTextExtractor'

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

  const { handleSubmit, isPending, isSuccess, error, data } =
    useCreateJobApplication()

  const errorMessage =
    extractionError ||
    (error
      ? error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.'
      : null)

  useEffect(() => {
    if (isSuccess && data) {
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
        title="New application"
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
