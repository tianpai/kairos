import { useEffect } from 'react'
import { useResumeStore } from '@typst-compiler/resumeState'
import type { TemplateData } from '@templates/template.types'

interface JobApplication {
  templateId?: string
  tailoredResume?: unknown
}

/**
 * Syncs job application data from the server to the resume store.
 * Handles the atomic update of both templateId and tailored resume data.
 */
export function useSyncJobApplicationToStore(
  jobApplication: JobApplication | undefined,
) {
  const loadParsedResume = useResumeStore((state) => state.loadParsedResume)

  useEffect(() => {
    if (!jobApplication) return

    const { templateId, tailoredResume } = jobApplication

    // Load templateId first (required for schema)
    if (templateId) {
      useResumeStore.setState({ templateId })

      // Then load the resume data (depends on templateId being set)
      if (tailoredResume) {
        loadParsedResume(tailoredResume as TemplateData)
      }
    }
  }, [jobApplication, loadParsedResume])
}
