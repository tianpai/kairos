import { saveChecklist } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import type { Checklist } from '@type/checklist'

export async function executeChecklistParsing(
  jobDescription: string,
): Promise<Checklist> {
  return aiWorker.execute<Checklist>('checklist.parsing', {
    jobDescription,
  })
}

export async function onChecklistParsingSuccess(
  jobId: string,
  checklist: Checklist,
): Promise<void> {
  await saveChecklist(jobId, checklist)
}
