import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  DEFAULT_TEMPLATE_NAME,
  premadeTemplates,
} from '@templates/premade-tmpl'
import { TemplateId } from '@templates/templateId'
import type { SubmitPayload } from '@/components/upload/newApplication.store'
import { createJob } from '@/api/jobs'
import { startWorkflow } from '@/api/workflow'
import { useNewApplicationStore } from '@/components/upload/newApplication.store'
import { friendlyError } from '@/utils/error'

export type CreateApplicationsInput = SubmitPayload

interface UseWorkflowReturn {
  createApplications: (input: CreateApplicationsInput) => Promise<void>
}

function showBatchResultToast(succeeded: number, total: number): void {
  if (succeeded === total) {
    toast.success(`Created ${total} application${total > 1 ? 's' : ''}`)
  } else if (succeeded > 0) {
    toast.warning(`Created ${succeeded} of ${total} applications`, {
      description: `${total - succeeded} failed to create`,
    })
  } else {
    toast.error('Failed to create applications')
  }
}

export function useWorkflow(): UseWorkflowReturn {
  const queryClient = useQueryClient()
  const setBatchProgress = useNewApplicationStore((s) => s.setBatchProgress)
  const closeModal = useNewApplicationStore((s) => s.closeModal)

  const invalidateApps = () =>
    queryClient.invalidateQueries({ queryKey: ['jobApplications'] })

  function resolveTemplateId(input: CreateApplicationsInput): string {
    if (input.resumeSource === 'upload') {
      const defaultConfig = premadeTemplates[DEFAULT_TEMPLATE_NAME]
      return TemplateId.toJSON(defaultConfig)
    }
    // For existing resume, templateId is resolved from source job in job:create handler
    return ''
  }

  async function createApplications(input: CreateApplicationsInput) {
    const total = input.entries.length
    closeModal()
    setBatchProgress({
      status: 'processing',
      current: 0,
      total,
      errorMessage: null,
    })

    let succeeded = 0

    try {
      const templateId = resolveTemplateId(input)

      for (const entry of input.entries) {
        try {
          const { jobId } = await createJob({
            resumeSource: input.resumeSource,
            resumeFile:
              input.resumeSource === 'upload' ? input.resumeFile : undefined,
            sourceJobId:
              input.resumeSource === 'existing' ? input.sourceJobId : undefined,
            templateId,
            jobDescription: entry.jobDescription,
            jobUrl: entry.jobUrl,
          })

          await startWorkflow(jobId, 'initial-analysis')
          succeeded++
          setBatchProgress({ current: succeeded })
        } catch (err) {
          console.error('[Batch] Entry failed:', err)
        }
      }

      invalidateApps()
      setBatchProgress({ status: 'completed' })
      showBatchResultToast(succeeded, total)
    } catch (err) {
      console.error('[Batch] Failed:', err)
      const message =
        err instanceof Error ? err.message : 'Failed to create applications'

      setBatchProgress({
        status: 'failed',
        errorMessage: message,
      })
      toast.error('Failed to create applications', {
        description: friendlyError(message),
      })
    }
  }

  return { createApplications }
}
