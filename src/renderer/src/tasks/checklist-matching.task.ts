import { saveChecklist } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import type { Checklist } from '@type/checklist'

export async function executeChecklistMatching(
  checklist: Checklist,
  resumeStructure: Record<string, unknown>,
): Promise<Checklist> {
  return aiWorker.execute<Checklist>('checklist.matching', {
    checklist,
    resumeStructure,
  })
}

export async function onChecklistMatchingSuccess(
  jobId: string,
  checklist: Checklist,
): Promise<void> {
  await saveChecklist(jobId, checklist)
}
