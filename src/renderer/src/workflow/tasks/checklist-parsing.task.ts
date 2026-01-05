/**
 * Checklist Parsing Task
 *
 * Extracts job requirements from job description.
 */

import { saveChecklist } from '@api/jobs'
import { aiWorker } from '../../workers/ai-worker-manager'
import { defineTask } from '../define-task'
import type { Checklist } from '@type/checklist'

export const checklistParsingTask = defineTask({
  name: 'checklist.parsing',
  inputKeys: ['jobDescription'],
  provides: 'checklist',
  tipEvent: 'checklist.parsed',

  async execute({ jobDescription }) {
    return aiWorker.execute<Checklist>('checklist.parsing', {
      jobDescription,
    })
  },

  async onSuccess(jobId, checklist) {
    await saveChecklist(jobId, checklist)
  },
})
