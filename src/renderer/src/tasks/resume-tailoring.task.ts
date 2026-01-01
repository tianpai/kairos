import { saveTailoredResume } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import type { Checklist } from '@type/checklist'

export async function executeResumeTailoring(
  checklist: Checklist,
  resumeStructure: Record<string, unknown>,
  templateId: string,
): Promise<Record<string, unknown>> {
  return aiWorker.execute<Record<string, unknown>>('resume.tailoring', {
    checklist,
    resumeStructure,
    templateId,
  })
}

export async function onResumeTailoringSuccess(
  jobId: string,
  tailoredResume: Record<string, unknown>,
): Promise<void> {
  await saveTailoredResume(jobId, tailoredResume)
}
