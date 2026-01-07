/**
 * Resume Parsing Task
 *
 * Parses raw resume content into structured format.
 */

import { saveParsedResume } from '@api/jobs'
import { aiClient } from '../../ai/ai-client'
import { defineTask } from '../define-task'
import type { ResumeStructure } from '../task-contracts'

export const resumeParsingTask = defineTask({
  name: 'resume.parsing',
  inputKeys: ['rawResumeContent', 'templateId'],
  provides: 'resumeStructure',

  async execute({ rawResumeContent, templateId }) {
    return aiClient.execute<ResumeStructure>('resume.parsing', {
      rawResumeContent,
      templateId,
    })
  },

  async onSuccess(jobId, resumeStructure) {
    await saveParsedResume(jobId, resumeStructure, resumeStructure)
  },
})
