/**
 * Job Info Extracting Task
 *
 * Extracts company, position, and due date from job description.
 * Updates DB directly (doesn't write to workflow context).
 */

import { getJobApplication, updateJobApplication } from '@api/jobs'
import { aiClient } from '../../ai/ai-client'
import { queryClient } from '../../integrations/tanstack-query/root-provider'
import { defineTask } from '../define-task'
import type { ExtractedJobInfo } from '../task-contracts'

const EXTRACTING_PLACEHOLDER = 'Extracting...'

export const jobInfoExtractingTask = defineTask({
  name: 'jobinfo.extracting',
  inputKeys: ['jobDescription'],
  // No 'provides' - updates DB directly, doesn't write to context

  async execute({ jobDescription }) {
    return aiClient.execute<ExtractedJobInfo>('jobinfo.extracting', {
      jobDescription,
    })
  },

  async onSuccess(jobId, extracted) {
    // Fetch current application to check which fields are placeholders
    const current = await getJobApplication(jobId)

    // Only update fields that are still showing placeholder values
    const updates: {
      companyName: string
      position: string
      dueDate: string
      jobUrl?: string | null
    } = {
      companyName: current.companyName,
      position: current.position,
      dueDate: current.dueDate,
      jobUrl: current.jobUrl,
    }

    let hasUpdates = false

    if (current.companyName === EXTRACTING_PLACEHOLDER && extracted.company) {
      updates.companyName = extracted.company
      hasUpdates = true
    }

    if (current.position === EXTRACTING_PLACEHOLDER && extracted.position) {
      updates.position = extracted.position
      hasUpdates = true
    }

    // dueDate: only update if AI found a specific deadline
    // (currently skipped as there's no placeholder for dates)

    if (hasUpdates) {
      await updateJobApplication(jobId, updates)
      // Invalidate queries to update sidebar
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      queryClient.invalidateQueries({ queryKey: ['jobApplication', jobId] })
    }
  },
})
