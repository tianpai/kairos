/**
 * Checklist Parsing Task
 *
 * Extracts job requirements from job description.
 */

import { saveChecklist } from '@api/jobs'
import { aiClient } from '../../ai/ai-client'
import { defineTask } from '../define-task'
import type { Checklist } from '@type/checklist'

export const checklistParsingTask = defineTask({
  name: 'checklist.parsing',
  inputKeys: ['jobDescription'],
  provides: 'checklist',
  tipEvent: 'checklist.parsed',

  async execute({ jobDescription }) {
    return aiClient.execute<Checklist>('checklist.parsing', {
      jobDescription,
    })
  },

  async onSuccess(jobId, checklist) {
    await saveChecklist(jobId, checklist)
  },
})
