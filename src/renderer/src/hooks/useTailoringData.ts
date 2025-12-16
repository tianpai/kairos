import { useMemo } from 'react'
import { useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useResumeStore } from '@typst-compiler/resumeState'
import { TemplateBuilder } from '@templates/builder'
import { getJobApplication } from '@api/jobs'

export function useTailoringData() {
  // Get jobId from URL search params (works on any route)
  const search = useSearch({ strict: false }) as { jobId?: string }
  const jobId = search?.jobId

  // Get checklist from React Query
  const { data: jobApplication } = useQuery({
    queryKey: ['jobApplication', jobId],
    queryFn: () => getJobApplication(jobId!),
    enabled: !!jobId,
  })

  // Get resume data from store
  const resumeStructure = useResumeStore((state) => state.data)
  const templateId = useResumeStore((state) => state.templateId)

  // Compute JSON schema from template
  const jsonSchema = useMemo(() => {
    const builder = new TemplateBuilder(templateId)
    const sectionSchemas = builder.getDataSchemas()
    const uiSchemas = builder.getUISchemas()

    const schemaShape: Record<string, z.ZodTypeAny> = {}
    Object.entries(sectionSchemas).forEach(([sectionId, sectionSchema]) => {
      const uiSchema = uiSchemas.find((s) => s.id === sectionId)
      if (uiSchema?.multiple) {
        schemaShape[sectionId] = z.array(sectionSchema)
      } else {
        schemaShape[sectionId] = sectionSchema
      }
    })

    const zodSchema = z.object(schemaShape)
    return z.toJSONSchema(zodSchema) as Record<string, unknown>
  }, [templateId])

  return {
    jobId,
    checklist: jobApplication?.checklist ?? undefined,
    resumeStructure,
    jsonSchema,
  }
}
