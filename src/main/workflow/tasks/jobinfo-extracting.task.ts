/**
 * Job Info Extracting Task
 *
 * Extracts company, position, and due date from job description.
 * Updates DB directly (doesn't write to workflow context).
 */

import { defineTask } from '../define-task'
import type { ExtractedJobInfo } from '@type/task-contracts'
import type { WorkflowTaskDeps } from './task-deps'

const EXTRACTING_PLACEHOLDER = 'Extracting...'

export function registerJobInfoExtractingTask({
  jobService,
  aiClient,
}: WorkflowTaskDeps): void {
  defineTask({
    name: 'jobinfo.extracting',
    inputKeys: ['jobDescription'],
    // No 'provides' - updates DB directly, doesn't write to context
    streaming: true,

    async execute({ jobDescription }, meta) {
      return aiClient.execute<ExtractedJobInfo>(
        'jobinfo.extracting',
        {
          jobDescription,
        },
        meta.emitPartial
          ? { streaming: true, onPartial: meta.emitPartial }
          : undefined,
      )
    },

    async onSuccess(jobId, extracted) {
      // Fetch current application to check which fields are placeholders
      const current = await jobService.getJobApplication(jobId)

      // Only update fields that are still showing placeholder values
      const updates: {
        companyName?: string
        position?: string
        dueDate?: string
        jobUrl?: string | null
      } = {}

      if (
        current.companyName === EXTRACTING_PLACEHOLDER &&
        extracted.company
      ) {
        updates.companyName = extracted.company
      }

      if (
        current.position === EXTRACTING_PLACEHOLDER &&
        extracted.position
      ) {
        updates.position = extracted.position
      }

      // dueDate: only update if AI found a specific deadline
      // (currently skipped as there's no placeholder for dates)

      if (Object.keys(updates).length > 0) {
        await jobService.updateJobApplication(jobId, updates)
      }
    },
  })
}
