import { saveParsedResume } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'

export async function executeResumeParsing(
  rawResumeContent: string,
  templateId: string,
): Promise<Record<string, unknown>> {
  return aiWorker.execute<Record<string, unknown>>('resume.parsing', {
    rawResumeContent,
    templateId,
  })
}

export async function onResumeParsingSuccess(
  jobId: string,
  resumeStructure: Record<string, unknown>,
): Promise<void> {
  await saveParsedResume(jobId, resumeStructure, resumeStructure)
}
