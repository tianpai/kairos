import { useMutation } from '@tanstack/react-query'
import { useResumeStore } from '@typst-compiler/resumeState'
import { saveResume } from '@/api/jobs'

export function useSaveResume(jobId: string) {
  const data = useResumeStore((state) => state.data)
  const templateId = useResumeStore((state) => state.templateId)

  return useMutation({
    mutationFn: async () => {
      return saveResume(jobId, data, templateId)
    },
  })
}
