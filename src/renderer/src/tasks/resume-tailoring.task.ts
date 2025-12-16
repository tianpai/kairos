import { aiWorker } from '../workers/ai-worker-manager'
import { saveTailoredResume } from '@api/jobs'
import type { Checklist } from '@type/checklist'

export async function executeResumeTailoring(
  checklist: Checklist,
  resumeStructure: Record<string, unknown>,
  jsonSchema: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return aiWorker.execute<Record<string, unknown>>('resume.tailoring', {
    checklist,
    resumeStructure,
    jsonSchema,
  })
}

export async function onResumeTailoringSuccess(
  jobId: string,
  tailoredResume: Record<string, unknown>,
): Promise<void> {
  await saveTailoredResume(jobId, tailoredResume)
}
