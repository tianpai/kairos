/**
 * Resume Tailoring Task
 *
 * Tailors resume content based on checklist requirements.
 */

import { saveTailoredResume } from '@api/jobs'
import { aiClient } from '../../ai/ai-client'
import { defineTask } from '../define-task'
import type { ResumeStructure } from '../task-contracts'

export const resumeTailoringTask = defineTask({
  name: 'resume.tailoring',
  inputKeys: ['checklist', 'resumeStructure', 'templateId'],
  provides: 'resumeStructure',
  tipEvent: 'tailoring.complete',

  async execute({ checklist, resumeStructure, templateId }) {
    return aiClient.execute<ResumeStructure>('resume.tailoring', {
      checklist,
      resumeStructure,
      templateId,
    })
  },

  async onSuccess(jobId, tailoredResume) {
    await saveTailoredResume(jobId, tailoredResume)
  },
})
