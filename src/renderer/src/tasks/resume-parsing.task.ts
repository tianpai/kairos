import { aiWorker } from '../workers/ai-worker-manager'
import { saveParsedResume } from '@api/jobs'

export async function executeResumeParsing(
  rawResumeContent: string,
  jsonSchema: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return aiWorker.execute<Record<string, unknown>>('resume.parsing', {
    rawResumeContent,
    jsonSchema,
  })
}

export async function onResumeParsingSuccess(
  jobId: string,
  resumeStructure: Record<string, unknown>,
): Promise<void> {
  await saveParsedResume(jobId, resumeStructure, resumeStructure)
}
