import { saveChecklist } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import { CHECKLIST_MATCHING } from '../workflow/workflow.types'
import { BaseTask } from './base.task'
import type { TaskTypeMap } from './base.task'

class ChecklistMatchingTask extends BaseTask<typeof CHECKLIST_MATCHING> {
  readonly name = CHECKLIST_MATCHING
  readonly inputKeys = ['checklist', 'resumeStructure'] as const
  readonly contextKey = 'checklist' as const

  async execute(
    input: TaskTypeMap[typeof CHECKLIST_MATCHING]['input'],
  ): Promise<TaskTypeMap[typeof CHECKLIST_MATCHING]['output']> {
    return aiWorker.execute<TaskTypeMap[typeof CHECKLIST_MATCHING]['output']>(
      CHECKLIST_MATCHING,
      {
        checklist: input.checklist,
        resumeStructure: input.resumeStructure,
      },
    )
  }

  async onSuccess(
    jobId: string,
    checklist: TaskTypeMap[typeof CHECKLIST_MATCHING]['output'],
  ): Promise<void> {
    await saveChecklist(jobId, checklist)
  }
}

export const checklistMatchingTask = new ChecklistMatchingTask()
