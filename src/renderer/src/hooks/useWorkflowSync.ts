import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useResumeStore } from '@typst-compiler/resumeState'
import { tip } from '@tips/tips.service'
import { useTipsStore } from '@tips/tips.store'
import {
  RESUME_PARSING,
  RESUME_TAILORING,
  SCORE_UPDATING,
  getWorkflowState,
  useWorkflowStore,
} from '../workflow'
import type { JobApplicationDetails } from '@api/jobs'
import type { TemplateData } from '@templates/template.types'
import type { TaskStateMap } from '../workflow'
import { friendlyError } from '@/utils/error'

/**
 * Syncs workflow state between main process, Zustand store, and React Query cache
 *
 * Responsibilities:
 * 1. Load workflow state from DB when navigating to a job (if not in store)
 * 2. Subscribe to workflow events from main
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

  // Effect 1: Load workflow state when navigating to a job
  useEffect(() => {
    if (!jobId) return

    // Check if we already have this workflow in memory
    const existingWorkflow = useWorkflowStore.getState().getWorkflow(jobId)
    if (existingWorkflow) {
      // Already loaded - don't overwrite (could be actively running)
      return
    }

    let cancelled = false

    const load = async () => {
      const workflow =
        (await getWorkflowState(jobId).catch(() => null)) ??
        jobApplication?.workflowSteps ??
        null

      if (!workflow || cancelled) return

      loadWorkflow(
        jobId,
        {
          jobId,
          workflowName: workflow.workflowName,
          taskStates: workflow.taskStates as TaskStateMap,
          status: workflow.status,
          error: workflow.error,
        },
        {
          jobId,
          resumeStructure:
            jobApplication?.tailoredResume ??
            jobApplication?.parsedResume ??
            undefined,
          checklist: jobApplication?.checklist ?? undefined,
        },
      )
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [jobId, jobApplication, loadWorkflow])

  // Effect 2: Subscribe to workflow events from main
  useEffect(() => {
    const unsubscribeState = window.kairos.workflow.onStateChanged(
      (payload) => {
        const store = useWorkflowStore.getState()
        const existingContext = store.getContext(payload.jobId)

        store.loadWorkflow(
          payload.jobId,
          {
            jobId: payload.jobId,
            workflowName: payload.workflow.workflowName,
            taskStates: payload.workflow.taskStates as TaskStateMap,
            status: payload.workflow.status,
            error: payload.workflow.error,
          },
          existingContext,
        )
      },
    )

    const unsubscribeTaskCompleted = window.kairos.workflow.onTaskCompleted(
      (payload) => {
        if (payload.provides && payload.result !== undefined) {
          useWorkflowStore.getState().updateContext(payload.jobId, {
            [payload.provides]: payload.result,
          })
        }

        // Invalidate job application query to refetch fresh data
        queryClient.invalidateQueries({
          queryKey: ['jobApplication', payload.jobId],
        })

        // If score updated, also invalidate the applications list for sidebar
        if (payload.taskName === SCORE_UPDATING) {
          queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
        }

        // If resume parsing or tailoring completed, load into resume store
        if (
          payload.taskName === RESUME_PARSING ||
          payload.taskName === RESUME_TAILORING
        ) {
          if (payload.result) {
            loadParsedResume(payload.result as TemplateData)
          }
        }
      },
    )

    const unsubscribeTaskFailed = window.kairos.workflow.onTaskFailed(
      (payload) => {
        const taskLabel = payload.taskName.toLowerCase().replace(/_/g, ' ')
        toast.error(`Failed: ${taskLabel}`, {
          description: friendlyError(payload.error),
        })
      },
    )

    const unsubscribeCompleted = window.kairos.workflow.onCompleted(
      (payload) => {
        const workflowLabel =
          payload.workflowName === 'tailoring'
            ? 'Tailoring complete'
            : 'Processing complete'

        const tipMessage = payload.tipEvent
          ? tip.appendToSuccess(payload.tipEvent, payload.tipData ?? {})
          : null

        toast.success(workflowLabel, {
          ...(tipMessage && {
            description: tipMessage,
            action: {
              label: 'Never show',
              onClick: () => {
                useTipsStore.getState().neverShow()
              },
            },
          }),
        })
      },
    )

    return () => {
      unsubscribeState()
      unsubscribeTaskCompleted()
      unsubscribeTaskFailed()
      unsubscribeCompleted()
    }
  }, [queryClient, loadParsedResume])
}
