import { saveTailoredResume } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import { RESUME_TAILORING } from '../workflow/workflow.types'
import { BaseTask } from './base.task'
import type { TaskTypeMap } from './base.task'

class ResumeTailoringTask extends BaseTask<typeof RESUME_TAILORING> {
  readonly name = RESUME_TAILORING
  readonly inputKeys = ['checklist', 'resumeStructure', 'templateId'] as const
  readonly contextKey = 'resumeStructure' as const
  readonly tipEvent = 'tailoring.complete'

  async execute(
    input: TaskTypeMap[typeof RESUME_TAILORING]['input'],
  ): Promise<TaskTypeMap[typeof RESUME_TAILORING]['output']> {
    return aiWorker.execute<TaskTypeMap[typeof RESUME_TAILORING]['output']>(
      RESUME_TAILORING,
      {
        checklist: input.checklist,
        resumeStructure: input.resumeStructure,
        templateId: input.templateId,
      },
    )
  }

  async onSuccess(
    jobId: string,
    tailoredResume: TaskTypeMap[typeof RESUME_TAILORING]['output'],
  ): Promise<void> {
    await saveTailoredResume(jobId, tailoredResume)
  }
}

export const resumeTailoringTask = new ResumeTailoringTask()
