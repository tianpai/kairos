import { useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useResumeStore } from '@typst-compiler/resumeState'
import { getJobApplication } from '@api/jobs'
import type { SectionEntry, TemplateData } from '@templates/template.types'

/**
 * Check if resume has any meaningful content (at least one non-empty section)
 */
function hasResumeContent(data: TemplateData): boolean {
  return Object.values(data).some((section) => {
    if (Array.isArray(section)) {
      // Array section: has at least one entry with non-empty values
      return section.some((entry: SectionEntry) =>
        Object.entries(entry).some(([key, value]) => {
          if (key === '_id') return false // Skip internal ID
          if (Array.isArray(value)) return value.length > 0
          return typeof value === 'string' && value.trim() !== ''
        }),
      )
    }
    // Object section: has at least one non-empty value
    return Object.entries(section).some(([key, value]) => {
      if (key === '_id') return false
      if (Array.isArray(value)) return value.length > 0
      return typeof value === 'string' && value.trim() !== ''
    })
  })
}

export function useTailoringData() {
  // Get jobId from URL search params (works on any route)
  const search = useSearch({ strict: false })
  const jobId = search.jobId

  // Get checklist from React Query
  const { data: jobApplication } = useQuery({
    queryKey: ['jobApplication', jobId],
    queryFn: () => getJobApplication(jobId!),
    enabled: !!jobId,
  })

  // Get resume data from store
  const resumeStructure = useResumeStore((state) => state.data)
  const templateId = useResumeStore((state) => state.templateId)

  // Check for required data
  const hasJobDescription = Boolean(jobApplication?.jobDescription?.trim())
  const resumeHasContent = hasResumeContent(resumeStructure)

  return {
    jobId,
    checklist: jobApplication?.checklist ?? undefined,
    resumeStructure,
    templateId,
    hasJobDescription,
    hasResumeContent: resumeHasContent,
  }
}
