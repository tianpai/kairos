import { saveParsedResume } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import { RESUME_PARSING } from '../workflow/workflow.types'
import { BaseTask } from './base.task'
import type { TaskTypeMap } from './base.task'

class ResumeParsingTask extends BaseTask<typeof RESUME_PARSING> {
  readonly name = RESUME_PARSING
  readonly inputKeys = ['rawResumeContent', 'templateId'] as const
  readonly contextKey = 'resumeStructure' as const

  async execute(
    input: TaskTypeMap[typeof RESUME_PARSING]['input'],
  ): Promise<TaskTypeMap[typeof RESUME_PARSING]['output']> {
    return aiWorker.execute<TaskTypeMap[typeof RESUME_PARSING]['output']>(
      RESUME_PARSING,
      {
        rawResumeContent: input.rawResumeContent,
        templateId: input.templateId,
      },
    )
  }

  async onSuccess(
    jobId: string,
    resumeStructure: TaskTypeMap[typeof RESUME_PARSING]['output'],
  ): Promise<void> {
    await saveParsedResume(jobId, resumeStructure, resumeStructure)
  }
}

export const resumeParsingTask = new ResumeParsingTask()
