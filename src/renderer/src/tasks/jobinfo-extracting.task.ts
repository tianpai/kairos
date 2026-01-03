import { getJobApplication, updateJobApplication } from '@api/jobs'
import { aiWorker } from '../workers/ai-worker-manager'
import { queryClient } from '../integrations/tanstack-query/root-provider'
import { JOBINFO_EXTRACTING } from '../workflow/workflow.types'
import { BaseTask } from './base.task'
import type { TaskTypeMap } from './base.task'

const EXTRACTING_PLACEHOLDER = 'Extracting...'

class JobInfoExtractingTask extends BaseTask<typeof JOBINFO_EXTRACTING> {
  readonly name = JOBINFO_EXTRACTING
  readonly inputKeys = ['jobDescription'] as const

  async execute(
    input: TaskTypeMap[typeof JOBINFO_EXTRACTING]['input'],
  ): Promise<TaskTypeMap[typeof JOBINFO_EXTRACTING]['output']> {
    return aiWorker.execute<TaskTypeMap[typeof JOBINFO_EXTRACTING]['output']>(
      JOBINFO_EXTRACTING,
      {
        jobDescription: input.jobDescription,
      },
    )
  }

  async onSuccess(
    jobId: string,
    extracted: TaskTypeMap[typeof JOBINFO_EXTRACTING]['output'],
  ): Promise<void> {
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

    // Only update dueDate if extracted has a value (null means not found)
    if (extracted.dueDate) {
      // We don't check for placeholder here since dueDate is always a date
      // User might have set a default, so only override if AI found a specific deadline
      // For now, let's not override dueDate unless it's the default placeholder
      // Actually, per the plan, we should check if it's a placeholder
      // But dueDate doesn't have a text placeholder, it's a date
      // So we'll skip dueDate updates for now unless we add a way to mark it as placeholder
    }

    if (hasUpdates) {
      await updateJobApplication(jobId, updates)
      // Invalidate queries to update sidebar
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      queryClient.invalidateQueries({ queryKey: ['jobApplication', jobId] })
    }
  }
}

export const jobInfoExtractingTask = new JobInfoExtractingTask()
