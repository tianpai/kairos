import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { TemplateBuilder } from '@templates/builder'
import {
  DEFAULT_TEMPLATE_NAME,
  premadeTemplates,
} from '@templates/premade-tmpl'
import { TemplateId } from '@templates/templateId'
import { startChecklistOnlyWorkflow } from '@workflow/workflow.service'
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
    mutationFn: async (payload: CreateFromScratchPayload & { jsonSchema: Record<string, unknown> }) => {
      const response = await createFromScratch(payload)
      return { response, payload }
    },
    onSuccess({ response, payload }) {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      // Start checklist workflow if job description was provided
      if (payload.jobDescription) {
        startChecklistOnlyWorkflow(response.id, {
          jobDescription: payload.jobDescription,
          resumeStructure: {},
          jsonSchema: payload.jsonSchema,
        })
      }
    },
  })

  function handleSubmit(input: CreateFromScratchInput) {
    const defaultConfig = premadeTemplates[DEFAULT_TEMPLATE_NAME]
    const defaultTemplateId = TemplateId.toJSON(defaultConfig)
    const jsonSchema = buildResumeJsonSchema(defaultTemplateId)

    const payload: CreateFromScratchPayload & { jsonSchema: Record<string, unknown> } = {
      ...input,
      templateId: defaultTemplateId,
      jsonSchema,
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

function buildResumeJsonSchema(templateId: string) {
  const builder = new TemplateBuilder(templateId)
  const sectionSchemas = builder.getDataSchemas()
  const uiSchemas = builder.getUISchemas()

  const schemaShape: Record<string, z.ZodTypeAny> = {}
  Object.entries(sectionSchemas).forEach(([sectionId, sectionSchema]) => {
    const uiSchema = uiSchemas.find((s) => s.id === sectionId)
    schemaShape[sectionId] = uiSchema?.multiple
      ? z.array(sectionSchema)
      : sectionSchema
  })

  const zodSchema = z.object(schemaShape)
  return z.toJSONSchema(zodSchema) as Record<string, unknown>
}
