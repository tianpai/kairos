import { useEffect } from 'react'
import { TemplateBuilder } from '@templates/builder'
import { useResumeStore } from '@typst-compiler/resumeState'
import type { TemplateData } from '@templates/template.types'

interface JobApplication {
  templateId?: string
  tailoredResume?: unknown
  parsedResume?: unknown
  originalResume?: string | null
}

/**
 * Syncs job application data from the server to the resume store.
 * Handles the atomic update of both templateId and tailored resume data.
 *
 * For scratch builds (no originalResume):
 * - Uses tailoredResume if available
 * - Falls back to parsedResume if no tailoredResume
 * - Uses default template data if neither exists
 */
export function useSyncJobApplicationToStore(
  jobApplication: JobApplication | undefined,
) {
  const loadParsedResume = useResumeStore((state) => state.loadParsedResume)
  const compile = useResumeStore((state) => state.compile)

  useEffect(() => {
    if (!jobApplication) return

    const { templateId, tailoredResume, parsedResume, originalResume } =
      jobApplication
    const isBuiltFromScratch = !originalResume

    // Load templateId first (required for schema)
    if (templateId) {
      useResumeStore.setState({ templateId })

      // Determine which resume data to load
      if (tailoredResume) {
        // Primary: use tailored resume
        loadParsedResume(tailoredResume as TemplateData)
      } else if (isBuiltFromScratch && parsedResume) {
        // Fallback for scratch builds: use parsed resume (baseline)
        loadParsedResume(parsedResume as TemplateData)
      } else if (isBuiltFromScratch) {
        // New scratch build with no data: load defaults
        const builder = new TemplateBuilder(templateId)
        const defaults = builder.getDefaults()
        useResumeStore.setState({ data: defaults })
        compile()
      }
    }
  }, [jobApplication, loadParsedResume, compile])
}
