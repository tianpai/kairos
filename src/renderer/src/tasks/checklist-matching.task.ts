import { saveChecklist } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import { Task } from './base.task'
import type { TaskTypeMap } from './base.task'

class ChecklistMatchingTask extends Task<'checklist.matching'> {
  readonly name = 'checklist.matching' as const
  readonly contextKey = 'checklist' as const

  async execute(
    input: TaskTypeMap['checklist.matching']['input'],
  ): Promise<TaskTypeMap['checklist.matching']['output']> {
    return aiWorker.execute<TaskTypeMap['checklist.matching']['output']>(
      'checklist.matching',
      {
        checklist: input.checklist,
        resumeStructure: input.resumeStructure,
      },
    )
  }

  async onSuccess(
    jobId: string,
    checklist: TaskTypeMap['checklist.matching']['output'],
  ): Promise<void> {
    await saveChecklist(jobId, checklist)
  }
}

export const checklistMatchingTask = new ChecklistMatchingTask()
