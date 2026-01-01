import { saveChecklist } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import { Task } from './base.task'
import type { TaskTypeMap } from './base.task'

class ChecklistParsingTask extends Task<'checklist.parsing'> {
  readonly name = 'checklist.parsing' as const

  async execute(
    input: TaskTypeMap['checklist.parsing']['input'],
  ): Promise<TaskTypeMap['checklist.parsing']['output']> {
    return aiWorker.execute<TaskTypeMap['checklist.parsing']['output']>(
      'checklist.parsing',
      {
        jobDescription: input.jobDescription,
      },
    )
  }

  async onSuccess(
    jobId: string,
    checklist: TaskTypeMap['checklist.parsing']['output'],
  ): Promise<void> {
    await saveChecklist(jobId, checklist)
  }
}

export const checklistParsingTask = new ChecklistParsingTask()
