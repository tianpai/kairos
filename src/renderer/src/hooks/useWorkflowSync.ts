import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useResumeStore } from '@typst-compiler/resumeState'
import { saveWorkflow } from '@api/jobs'
import {
  RESUME_PARSING,
  RESUME_TAILORING,
  SCORE_UPDATING,
  recoverStaleWorkflow,
  useWorkflowStore,
} from '../workflow'
import type { JobApplicationDetails } from '@api/jobs'
import type { TemplateData } from '@templates/template.types'
import type { TaskStateMap } from '../workflow'

/**
 * Syncs workflow state between DB, Zustand store, and React Query cache
 *
 * Responsibilities:
 * 1. Load workflow state from DB when navigating to a job (if not in store)
 * 2. Recover stale "running" workflows that were interrupted
 * 3. Invalidate queries when tasks complete
 * 4. Load resume data into resume store when parsing/tailoring completes
 */
export function useWorkflowSync(
  jobId: string | undefined,
  jobApplication: JobApplicationDetails | undefined,
) {
  const queryClient = useQueryClient()
  const loadParsedResume = useResumeStore((state) => state.loadParsedResume)

  // Store actions
  const loadWorkflow = useWorkflowStore((state) => state.loadWorkflow)

  // Track previous task states to detect completions (per jobId)
  const prevTaskStatesRef = useRef<
    Record<string, Record<string, string> | undefined>
  >({})

  // Effect 1: Load workflow from DB when navigating to a job
  useEffect(() => {
    if (!jobId || !jobApplication?.workflowSteps) return

    // Check if we already have this workflow in memory
    const existingWorkflow = useWorkflowStore.getState().getWorkflow(jobId)
    if (existingWorkflow) {
      // Already loaded - don't overwrite (could be actively running)
      return
    }

    const { workflowSteps } = jobApplication

    // Recover from any stale running states
    const { recovered, wasStale } = recoverStaleWorkflow(workflowSteps)

    // If recovery changed the state, persist it back to DB
    if (wasStale) {
      saveWorkflow(jobId, recovered, recovered.status).catch((error) => {
        console.error(
          '[WorkflowSync] Failed to save recovered workflow state:',
          error,
        )
      })
    }

    // Load into store
    loadWorkflow(
      jobId,
      {
        jobId,
        workflowName: recovered.workflowName,
        taskStates: recovered.taskStates as TaskStateMap,
        status: recovered.status as 'idle' | 'running' | 'completed' | 'failed',
        error: recovered.error,
      },
      {
        jobId,
        resumeStructure:
          jobApplication.tailoredResume ??
          jobApplication.parsedResume ??
          undefined,
        checklist: jobApplication.checklist ?? undefined,
      },
    )
  }, [jobId, jobApplication?.workflowSteps, loadWorkflow])

  // Effect 2: Detect task completions and sync to React Query / resume store
  useEffect(() => {
    if (!jobId) {
      prevTaskStatesRef.current = {}
      return
    }

    const workflow = useWorkflowStore.getState().getWorkflow(jobId)
    const context = useWorkflowStore.getState().getContext(jobId)

    if (!workflow) {
      // Clean up prev states for this job if workflow doesn't exist
      delete prevTaskStatesRef.current[jobId]
      return
    }

    const currentTaskStates = workflow.taskStates
    const prevTaskStates = prevTaskStatesRef.current[jobId] || {}

    // Find tasks that just completed
    const justCompleted: Array<string> = []
    for (const [task, status] of Object.entries(currentTaskStates)) {
      if (status === 'completed' && prevTaskStates[task] !== 'completed') {
        justCompleted.push(task)
      }
    }

    // Update ref for next comparison
    prevTaskStatesRef.current[jobId] = { ...currentTaskStates }

    if (justCompleted.length === 0) return

    // Invalidate job application query to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ['jobApplication', jobId] })

    // If score updated, also invalidate the applications list for sidebar
    if (justCompleted.includes(SCORE_UPDATING)) {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
    }

    // If resume parsing or tailoring completed, load into resume store
    if (
      justCompleted.includes(RESUME_PARSING) ||
      justCompleted.includes(RESUME_TAILORING)
    ) {
      if (context?.resumeStructure) {
        loadParsedResume(context.resumeStructure as TemplateData)
      }
    }
  }, [
    jobId,
    // Subscribe to workflow changes for the current job
    useWorkflowStore((state) => (jobId ? state.workflows[jobId] : undefined)),
    useWorkflowStore((state) => (jobId ? state.contexts[jobId] : undefined)),
    queryClient,
    loadParsedResume,
  ])
}
