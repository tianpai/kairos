import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  DEFAULT_TEMPLATE_NAME,
  premadeTemplates,
} from '@templates/premade-tmpl'
import { TemplateId } from '@templates/templateId'
import { RESUME_PARSING, startWorkflow, waitForTask } from '@/workflow'
import {
  createFromExisting,
  createJobApplication,
  getJobApplication,
} from '@/api/jobs'
import { extractResumeText } from '@/utils/resumeTextExtractor'
import {
  EXTRACTING_PLACEHOLDER,
  getDefaultDueDate,
  useNewApplicationStore,
} from '@/components/upload/newApplication.store'
import { friendlyError } from '@/utils/error'

type BatchEntry = { jobDescription: string; jobUrl?: string }

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

async function createBatchApp(
  entry: BatchEntry,
  sourceJobId: string,
  templateId: string,
  parsedResume: Record<string, unknown>,
  onProgress: () => void,
): Promise<{ success: boolean; id?: string }> {
  try {
    const response = await createFromExisting({
      sourceJobId,
      companyName: EXTRACTING_PLACEHOLDER,
      position: EXTRACTING_PLACEHOLDER,
      dueDate: getDefaultDueDate(),
      jobDescription: entry.jobDescription,
      jobUrl: entry.jobUrl,
      templateId,
    })

    startWorkflow('checklist-only', response.id, {
      jobDescription: entry.jobDescription,
      resumeStructure: parsedResume,
      templateId,
    }).catch((err) =>
      console.error(`[Batch] Workflow failed for ${response.id}:`, err),
    )

    onProgress()
    return { success: true, id: response.id }
  } catch (err) {
    console.error('[Batch] Failed to create application:', err)
    return { success: false }
  }
}

export function useBatchCreation() {
  const queryClient = useQueryClient()
  const setBatchProgress = useNewApplicationStore((s) => s.setBatchProgress)
  const closeModal = useNewApplicationStore((s) => s.closeModal)

  const invalidateApps = () =>
    queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
  const onProgress = () =>
    setBatchProgress({
      current: useNewApplicationStore.getState().batchProgress.current + 1,
    })

  async function handleBatchUpload(
    resumeFile: File,
    entries: Array<BatchEntry>,
  ) {
    closeModal()
    setBatchProgress({
      status: 'processing',
      current: 0,
      total: entries.length,
      errorMessage: null,
    })

    try {
      const rawResumeContent = await extractResumeText(resumeFile)
      const [firstEntry, ...restEntries] = entries

      const defaultConfig = premadeTemplates[DEFAULT_TEMPLATE_NAME]
      const defaultTemplateId = TemplateId.toJSON(defaultConfig)

      // Create first app with full workflow
      const firstResponse = await createJobApplication({
        rawResumeContent,
        jobDescription: firstEntry.jobDescription,
        companyName: EXTRACTING_PLACEHOLDER,
        position: EXTRACTING_PLACEHOLDER,
        dueDate: getDefaultDueDate(),
        jobUrl: firstEntry.jobUrl,
        templateId: defaultTemplateId,
      })

      startWorkflow('create-application', firstResponse.id, {
        rawResumeContent,
        jobDescription: firstEntry.jobDescription,
        templateId: defaultTemplateId,
      }).catch((err) => console.error('[Batch] First workflow failed:', err))

      invalidateApps()
      onProgress()

      // Wait for resume parsing, then create remaining apps
      await waitForTask(firstResponse.id, RESUME_PARSING)

      const firstJob = await getJobApplication(firstResponse.id)
      if (!firstJob.parsedResume) {
        setBatchProgress({
          status: 'failed',
          errorMessage: 'Resume parsing failed',
        })
        toast.error('Resume parsing failed', {
          description:
            'Could not parse resume to create remaining applications',
        })
        return
      }

      const results = await Promise.all(
        restEntries.map((entry) =>
          createBatchApp(
            entry,
            firstResponse.id,
            firstJob.templateId,
            firstJob.parsedResume!,
            onProgress,
          ),
        ),
      )

      const restSucceeded = results.filter((r) => r.success).length
      const totalSucceeded = 1 + restSucceeded // +1 for first app

      invalidateApps()
      setBatchProgress({ status: 'completed' })
      showBatchResultToast(totalSucceeded, entries.length)
    } catch (err) {
      console.error('[Batch] Upload failed:', err)
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

  async function handleBatchExisting(
    sourceJobId: string,
    entries: Array<BatchEntry>,
  ) {
    closeModal()
    setBatchProgress({
      status: 'processing',
      current: 0,
      total: entries.length,
      errorMessage: null,
    })

    try {
      const sourceJob = await getJobApplication(sourceJobId)
      if (!sourceJob.parsedResume) {
        setBatchProgress({
          status: 'failed',
          errorMessage: 'Source has no parsed resume',
        })
        toast.error('Source has no parsed resume', {
          description: 'Select an application with a parsed resume',
        })
        return
      }

      const results = await Promise.all(
        entries.map((entry) =>
          createBatchApp(
            entry,
            sourceJobId,
            sourceJob.templateId,
            sourceJob.parsedResume!,
            onProgress,
          ),
        ),
      )

      const succeeded = results.filter((r) => r.success).length

      invalidateApps()
      setBatchProgress({ status: 'completed' })
      showBatchResultToast(succeeded, entries.length)
    } catch (err) {
      console.error('[Batch] Existing failed:', err)
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

  return { handleBatchUpload, handleBatchExisting }
}
