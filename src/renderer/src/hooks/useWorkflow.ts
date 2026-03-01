import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  DEFAULT_TEMPLATE_NAME,
  premadeTemplates,
} from '@templates/premade-tmpl'
import { TemplateId } from '@templates/templateId'
import type { WorkflowCreateApplicationsPayload } from '@type/workflow-ipc'
import type { SubmitPayload } from '@/components/upload/newApplication.store'
import { createApplications as createApplicationsCommand } from '@/api/workflow'
import { useNewApplicationStore } from '@/components/upload/newApplication.store'
import { friendlyError } from '@/utils/error'

export type CreateApplicationsInput = SubmitPayload

interface UseWorkflowReturn {
  createApplications: (input: CreateApplicationsInput) => Promise<void>
}

type WorkflowCommandError = Error & {
  toastTitle?: string
  toastDescription?: string
}

/** Show toast based on batch creation results */
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

  async function withBatchProgress(
    total: number,
    execute: () => Promise<number>,
  ) {
    closeModal()
    setBatchProgress({
      status: 'processing',
      current: 0,
      total,
      errorMessage: null,
    })

    try {
      const succeeded = await execute()
      invalidateApps()
      setBatchProgress({ status: 'completed' })
      showBatchResultToast(succeeded, total)
    } catch (err) {
      console.error('[Batch] Failed:', err)
      const batchError = err as WorkflowCommandError
      const message =
        err instanceof Error ? err.message : 'Failed to create applications'

      setBatchProgress({
        status: 'failed',
        errorMessage: message,
      })
      toast.error(batchError.toastTitle ?? 'Failed to create applications', {
        description: batchError.toastDescription ?? friendlyError(message),
      })
    }
  }

  function toCreateApplicationsPayload(
    input: CreateApplicationsInput,
  ): WorkflowCreateApplicationsPayload {
    if (input.resumeSource === 'upload') {
      const defaultConfig = premadeTemplates[DEFAULT_TEMPLATE_NAME]
      const templateId = TemplateId.toJSON(defaultConfig)
      return { ...input, templateId }
    }

    return input
  }

  async function createApplications(input: CreateApplicationsInput) {
    await withBatchProgress(input.entries.length, () =>
      createApplicationsCommand(toCreateApplicationsPayload(input)).then(
        (result) => {
          setBatchProgress({ current: result.succeeded })
          return result.succeeded
        },
      ),
    )
  }

  return { createApplications }
}
