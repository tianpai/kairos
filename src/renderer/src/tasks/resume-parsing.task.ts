import { saveParsedResume } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import { Task  } from './base.task'
import type {TaskTypeMap} from './base.task';

class ResumeParsingTask extends Task<'resume.parsing'> {
  readonly name = 'resume.parsing' as const
  readonly contextKey = 'resumeStructure' as const

  async execute(
    input: TaskTypeMap['resume.parsing']['input'],
  ): Promise<TaskTypeMap['resume.parsing']['output']> {
    return aiWorker.execute<TaskTypeMap['resume.parsing']['output']>(
      'resume.parsing',
      {
        rawResumeContent: input.rawResumeContent,
        templateId: input.templateId,
      },
    )
  }

  async onSuccess(
    jobId: string,
    resumeStructure: TaskTypeMap['resume.parsing']['output'],
  ): Promise<void> {
    await saveParsedResume(jobId, resumeStructure, resumeStructure)
  }
}

export const resumeParsingTask = new ResumeParsingTask()
