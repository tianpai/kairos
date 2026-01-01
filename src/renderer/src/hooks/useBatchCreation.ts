import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { TemplateBuilder } from '@templates/builder'
import {
  DEFAULT_TEMPLATE_NAME,
  premadeTemplates,
} from '@templates/premade-tmpl'
import { TemplateId } from '@templates/templateId'
import {
  startChecklistOnlyWorkflow,
  startCreateApplicationWorkflow,
  waitForTaskCompletion,
} from '@workflow/workflow.service'
import { RESUME_PARSING } from '@workflow/workflow.types'
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

function buildResumeJsonSchema(templateId: string): Record<string, unknown> {
  const builder = new TemplateBuilder(templateId)
  const sectionSchemas = builder.getDataSchemas()
  const uiSchemas = builder.getUISchemas()

  const schemaShape: Record<string, z.ZodTypeAny> = {}
  for (const [sectionId, sectionSchema] of Object.entries(sectionSchemas)) {
    const uiSchema = uiSchemas.find((s) => s.id === sectionId)
    schemaShape[sectionId] = uiSchema?.multiple
      ? z.array(sectionSchema)
      : sectionSchema
  }

  return z.toJSONSchema(z.object(schemaShape)) as Record<string, unknown>
}

type BatchEntry = { jobDescription: string; jobUrl?: string }

async function createBatchApp(
  entry: BatchEntry,
  sourceJobId: string,
  templateId: string,
  parsedResume: Record<string, unknown>,
  jsonSchema: Record<string, unknown>,
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

    startChecklistOnlyWorkflow(response.id, {
      jobDescription: entry.jobDescription,
      resumeStructure: parsedResume,
      jsonSchema,
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
    setBatchProgress({
      status: 'processing',
      current: 0,
      total: entries.length,
      errorMessage: null,
    })
    closeModal()

    try {
      const rawResumeContent = await extractResumeText(resumeFile)
      const [firstEntry, ...restEntries] = entries

      const defaultConfig = premadeTemplates[DEFAULT_TEMPLATE_NAME]
      const defaultTemplateId = TemplateId.toJSON(defaultConfig)
      const jsonSchema = buildResumeJsonSchema(defaultTemplateId)

      // Create first app with full workflow
      const firstResponse = await createJobApplication({
        rawResumeContent,
        jobDescription: firstEntry.jobDescription,
        companyName: EXTRACTING_PLACEHOLDER,
        position: EXTRACTING_PLACEHOLDER,
        dueDate: getDefaultDueDate(),
        jobUrl: firstEntry.jobUrl,
        templateId: defaultTemplateId,
        jsonSchema,
      })

      startCreateApplicationWorkflow(firstResponse.id, {
        rawResumeContent,
        jobDescription: firstEntry.jobDescription,
        jsonSchema,
      }).catch((err) => console.error('[Batch] First workflow failed:', err))

      invalidateApps()
      onProgress()

      // Wait for resume parsing, then create remaining apps
      await waitForTaskCompletion(firstResponse.id, RESUME_PARSING)

      const firstJob = await getJobApplication(firstResponse.id)
      if (!firstJob.parsedResume) {
        setBatchProgress({
          status: 'failed',
          errorMessage: 'Resume parsing failed',
        })
        return
      }

      await Promise.all(
        restEntries.map((entry) =>
          createBatchApp(
            entry,
            firstResponse.id,
            firstJob.templateId,
            firstJob.parsedResume!,
            jsonSchema,
            onProgress,
          ),
        ),
      )

      invalidateApps()
      setBatchProgress({ status: 'completed' })
    } catch (err) {
      console.error('[Batch] Upload failed:', err)
      setBatchProgress({
        status: 'failed',
        errorMessage: 'Batch creation failed',
      })
    }
  }

  async function handleBatchExisting(
    sourceJobId: string,
    entries: Array<BatchEntry>,
  ) {
    setBatchProgress({
      status: 'processing',
      current: 0,
      total: entries.length,
      errorMessage: null,
    })
    closeModal()

    try {
      const sourceJob = await getJobApplication(sourceJobId)
      if (!sourceJob.parsedResume) {
        setBatchProgress({
          status: 'failed',
          errorMessage: 'Source has no parsed resume',
        })
        return
      }

      const jsonSchema = buildResumeJsonSchema(sourceJob.templateId)

      await Promise.all(
        entries.map((entry) =>
          createBatchApp(
            entry,
            sourceJobId,
            sourceJob.templateId,
            sourceJob.parsedResume!,
            jsonSchema,
            onProgress,
          ),
        ),
      )

      invalidateApps()
      setBatchProgress({ status: 'completed' })
    } catch (err) {
      console.error('[Batch] Existing failed:', err)
      setBatchProgress({
        status: 'failed',
        errorMessage: 'Batch creation failed',
      })
    }
  }

  return { handleBatchUpload, handleBatchExisting }
}
