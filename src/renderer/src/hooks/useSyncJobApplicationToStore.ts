import { useEffect } from 'react'
import { TemplateBuilder } from '@templates/builder'
import { useResumeStore } from '@typst-compiler/resumeState'
import type { TemplateData } from '@templates/template.types'

interface JobApplication {
  templateId?: string
  tailoredResume?: unknown
  parsedResume?: unknown
}

/**
 * Syncs job application data from the server to the resume store.
 * Handles the atomic update of both templateId and resume data.
 *
 * Priority:
 * 1. tailoredResume (if user has tailored the resume)
 * 2. parsedResume (if AI has parsed the resume)
 * 3. Default template data (for new jobs or while parsing is in progress)
 */
export function useSyncJobApplicationToStore(
  jobApplication: JobApplication | undefined,
) {
  const loadParsedResume = useResumeStore((state) => state.loadParsedResume)
  const compile = useResumeStore((state) => state.compile)

  useEffect(() => {
    if (!jobApplication) return

    const { templateId, tailoredResume, parsedResume } = jobApplication

    // Load templateId first (required for schema)
    if (templateId) {
      useResumeStore.setState({ templateId })

      // Determine which resume data to load
      if (tailoredResume) {
        // Primary: use tailored resume
        loadParsedResume(tailoredResume as TemplateData)
      } else if (parsedResume) {
        // Fallback: use parsed resume (for both scratch and uploaded)
        loadParsedResume(parsedResume as TemplateData)
      } else {
        // No resume data yet (new build or parsing in progress): load defaults
        const builder = new TemplateBuilder(templateId)
        const defaults = builder.getDefaults()
        useResumeStore.setState({ data: defaults })
        compile()
      }
    }
  }, [jobApplication, loadParsedResume, compile])
}
