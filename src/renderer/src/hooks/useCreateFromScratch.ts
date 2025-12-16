import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DEFAULT_TEMPLATE_NAME,
  premadeTemplates,
} from '@templates/premade-tmpl'
import { TemplateId } from '@templates/templateId'
import type { CreateFromScratchPayload } from '@/api/jobs'
import { createFromScratch } from '@/api/jobs'

export interface CreateFromScratchInput {
  companyName: string
  position: string
  dueDate: string
  jobDescription?: string
}

export function useCreateFromScratch() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: CreateFromScratchPayload) => {
      return createFromScratch(payload)
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
    },
  })

  function handleSubmit(input: CreateFromScratchInput) {
    const defaultConfig = premadeTemplates[DEFAULT_TEMPLATE_NAME]
    const defaultTemplateId = TemplateId.toJSON(defaultConfig)

    const payload: CreateFromScratchPayload = {
      ...input,
      templateId: defaultTemplateId,
    }

    mutation.mutate(payload)
  }

  return {
    handleSubmit,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
  }
}
