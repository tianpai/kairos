import { saveChecklist } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import { CHECKLIST_PARSING } from '../workflow/workflow.types'
import { BaseTask } from './base.task'
import type { TaskTypeMap } from './base.task'

class ChecklistParsingTask extends BaseTask<typeof CHECKLIST_PARSING> {
  readonly name = CHECKLIST_PARSING
  readonly inputKeys = ['jobDescription'] as const
  readonly contextKey = 'checklist' as const
  readonly tipEvent = 'checklist.parsed'

  async execute(
    input: TaskTypeMap[typeof CHECKLIST_PARSING]['input'],
  ): Promise<TaskTypeMap[typeof CHECKLIST_PARSING]['output']> {
    return aiWorker.execute<TaskTypeMap[typeof CHECKLIST_PARSING]['output']>(
      CHECKLIST_PARSING,
      {
        jobDescription: input.jobDescription,
      },
    )
  }

  async onSuccess(
    jobId: string,
    checklist: TaskTypeMap[typeof CHECKLIST_PARSING]['output'],
  ): Promise<void> {
    await saveChecklist(jobId, checklist)
  }
}

export const checklistParsingTask = new ChecklistParsingTask()
