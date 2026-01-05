/**
 * Checklist Matching Task
 *
 * Matches resume content against job requirements.
 * Uses AI worker to determine which requirements are fulfilled.
 */

import { saveChecklist } from '@api/jobs'
import { aiWorker } from '../../workers/ai-worker-manager'
import { defineTask } from '../define-task'
import type { Checklist } from '@type/checklist'

export const checklistMatchingTask = defineTask({
  name: 'checklist.matching',
  inputKeys: ['checklist', 'resumeStructure'],
  provides: 'checklist', // Overwrites checklist with fulfilled status

  async execute({ checklist, resumeStructure }) {
    return aiWorker.execute<Checklist>('checklist.matching', {
      checklist,
      resumeStructure,
    })
  },

  async onSuccess(jobId, checklist) {
    await saveChecklist(jobId, checklist)
  },
})
