import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { TemplateBuilder } from '@templates/builder'
import {
  DEFAULT_TEMPLATE_NAME,
  premadeTemplates,
} from '@templates/premade-tmpl'
import { TemplateId } from '@templates/templateId'
import { startCreateApplicationWorkflow } from '@workflow/workflow.service'
import type {
  CreateJobApplicationPayload,
  JobApplicationInput,
} from '@/api/jobs'
import { createJobApplication } from '@/api/jobs'

export function useCreateJobApplication() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: CreateJobApplicationPayload) => {
      const response = await createJobApplication(payload)
      // Return both response and payload for use in onSuccess
      return { response, payload }
    },
    onSuccess({ response, payload }) {
      console.log('[NEW] Job created, starting workflow for:', response.id)
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      // Start workflow with the job ID from the response
      startCreateApplicationWorkflow(response.id, {
        rawResumeContent: payload.rawResumeContent,
        jobDescription: payload.jobDescription,
        jsonSchema: payload.jsonSchema,
      }).catch((error) => {
        console.error('[Workflow] Failed to start create-application workflow:', error)
      })
    },
  })

  function handleSubmit(payload: JobApplicationInput) {
    // FIX: the whole point is to get jsonSchema of the default template
    const defaultConfig = premadeTemplates[DEFAULT_TEMPLATE_NAME]
    const defaultTemplateId = TemplateId.toJSON(defaultConfig)
    const jsonSchema = buildResumeJsonSchema(defaultTemplateId)

    const jobApplicationPayload: CreateJobApplicationPayload = {
      ...payload,
      templateId: defaultTemplateId,
      jsonSchema,
    }

    mutation.mutate(jobApplicationPayload)
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
  const sectionSchemas = builder.getDataSchemas() // Use data schemas (no defaults, all required)
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
