import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { onWorkflowPushState } from '@api/workflow'
import { useWorkflowRuntimeStore } from './workflowRuntime.store'
import type { WfState } from '@type/workflow'
import { friendlyError } from '@/utils/error'

function invalidateJob(
  queryClient: ReturnType<typeof useQueryClient>,
  jobId: string,
) {
  queryClient.invalidateQueries({ queryKey: ['jobSummary', jobId] })
  queryClient.invalidateQueries({ queryKey: ['jobResume', jobId] })
  queryClient.invalidateQueries({ queryKey: ['jobChecklist', jobId] })
  queryClient.invalidateQueries({ queryKey: ['jobWorkflow', jobId] })
}

function hasFailedTasks(state: WfState): string[] {
  return Object.entries(state.tasks)
    .filter(([, t]) => t.status === 'failed' && t.error)
    .map(([name, t]) => `${name}: ${t.error!.message}`)
}

function hasCompletedScoreUpdate(
  prev: WfState | undefined,
  next: WfState,
): boolean {
  const prevStatus = prev?.tasks['score.updating']?.status
  const nextStatus = next.tasks['score.updating']?.status
  return prevStatus !== 'completed' && nextStatus === 'completed'
}

export function useWorkflowEvents() {
  const queryClient = useQueryClient()
  const prevStates = useRef<Record<string, WfState>>({})

  useEffect(() => {
    const unsubscribe = onWorkflowPushState(({ jobId, state }) => {
      const runtimeStore = useWorkflowRuntimeStore.getState()
      const prev = prevStates.current[jobId]

      if (state === null) {
        // Workflow completed — clear store, invalidate, toast
        runtimeStore.clearWorkflowState(jobId)
        delete prevStates.current[jobId]
        invalidateJob(queryClient, jobId)
        queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
        toast.success('Processing complete')
        return
      }

      // Update store
      runtimeStore.setWorkflowState(jobId, state)
      prevStates.current[jobId] = state

      // Check for newly failed tasks
      const failures = hasFailedTasks(state)
      const prevFailures = prev ? hasFailedTasks(prev) : []
      const newFailures = failures.filter((f) => !prevFailures.includes(f))
      for (const failure of newFailures) {
        const [taskLabel, message] = failure.split(': ', 2)
        toast.error(`Failed: ${taskLabel}`, {
          description: friendlyError(message),
        })
      }

      // Invalidate queries on any state change
      invalidateJob(queryClient, jobId)

      // Invalidate job list when score updates complete
      if (hasCompletedScoreUpdate(prev, state)) {
        queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [queryClient])
}
