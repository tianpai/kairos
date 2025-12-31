import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { TemplateBuilder } from '@templates/builder'
import { startChecklistOnlyWorkflow } from '@workflow/workflow.service'
import type { CreateFromExistingPayload } from '@/api/jobs'
import { createFromExisting } from '@/api/jobs'

export interface CreateFromExistingInput {
  sourceJobId: string
  companyName: string
  position: string
  dueDate: string
  jobDescription: string
  jobUrl?: string
  sourceTemplateId: string
}

export function useCreateFromExisting() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (
      payload: CreateFromExistingPayload & {
        jsonSchema: Record<string, unknown>
        sourceResumeStructure: Record<string, unknown>
      },
    ) => {
      const response = await createFromExisting(payload)
      return { response, payload }
    },
    onSuccess({ response, payload }) {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      // Start checklist workflow with the copied resume structure
      startChecklistOnlyWorkflow(response.id, {
        jobDescription: payload.jobDescription,
        resumeStructure: payload.sourceResumeStructure,
        jsonSchema: payload.jsonSchema,
      })
    },
  })

  function handleSubmit(
    input: CreateFromExistingInput,
    sourceResumeStructure: Record<string, unknown>,
  ) {
    // Use source's templateId to ensure data structure matches
    const templateId = input.sourceTemplateId
    const jsonSchema = buildResumeJsonSchema(templateId)

    const payload: CreateFromExistingPayload & {
      jsonSchema: Record<string, unknown>
      sourceResumeStructure: Record<string, unknown>
    } = {
      ...input,
      templateId,
      jsonSchema,
      sourceResumeStructure,
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
