import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DEFAULT_TEMPLATE_NAME,
  premadeTemplates,
} from '@templates/premade-tmpl'
import { TemplateId } from '@templates/templateId'
import { startWorkflow } from '@workflow/workflow.service'
import type { CreateFromScratchPayload } from '@/api/jobs'
import { createFromScratch } from '@/api/jobs'

export interface CreateFromScratchInput {
  companyName: string
  position: string
  dueDate: string
  jobDescription?: string
  jobUrl?: string
}

export function useCreateFromScratch() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: CreateFromScratchPayload) => {
      const response = await createFromScratch(payload)
      return { response, payload }
    },
    onSuccess({ response, payload }) {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      // Start checklist workflow if job description was provided
      if (payload.jobDescription) {
        startWorkflow('checklist-only', response.id, {
          jobDescription: payload.jobDescription,
          resumeStructure: {},
          templateId: payload.templateId,
        })
      }
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
    data: mutation.data?.response,
  }
}
