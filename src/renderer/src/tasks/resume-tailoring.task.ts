import { saveTailoredResume } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import { Task } from './base.task'
import type { TaskTypeMap } from './base.task'

class ResumeTailoringTask extends Task<'resume.tailoring'> {
  readonly name = 'resume.tailoring' as const

  async execute(
    input: TaskTypeMap['resume.tailoring']['input'],
  ): Promise<TaskTypeMap['resume.tailoring']['output']> {
    return aiWorker.execute<TaskTypeMap['resume.tailoring']['output']>(
      'resume.tailoring',
      {
        checklist: input.checklist,
        resumeStructure: input.resumeStructure,
        templateId: input.templateId,
      },
    )
  }

  async onSuccess(
    jobId: string,
    tailoredResume: TaskTypeMap['resume.tailoring']['output'],
  ): Promise<void> {
    await saveTailoredResume(jobId, tailoredResume)
  }
}

export const resumeTailoringTask = new ResumeTailoringTask()
