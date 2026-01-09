import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useResumeStore } from '@typst-compiler/resumeState'
import { saveParsedResume, saveResume } from '@/api/jobs'

interface UseSaveResumeOptions {
  isBuiltFromScratch?: boolean
}

export function useSaveResume(
  jobId: string,
  options: UseSaveResumeOptions = {},
) {
  const { isBuiltFromScratch = false } = options
  const data = useResumeStore((state) => state.data)
  const templateId = useResumeStore((state) => state.templateId)

  return useMutation({
    mutationFn: async () => {
      // For builds from scratch, also save to parsedResume as the baseline
      if (isBuiltFromScratch) {
        await saveParsedResume(jobId, data, data)
      }
      return saveResume(jobId, data, templateId)
    },
    onSuccess: () => {
      toast.success('Resume saved')
    },
    onError: () => {
      toast.error('Failed to save resume')
    },
  })
}
