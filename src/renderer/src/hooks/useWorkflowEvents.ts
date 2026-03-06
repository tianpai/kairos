import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  onWorkflowPushState,
} from '@api/workflow'
import { SCORE_UPDATING } from '@type/task-names'
import { useWorkflowRuntimeStore } from './workflowRuntime.store'
import { friendlyError } from '@/utils/error'

function invalidateJob(
  queryClient: ReturnType<typeof useQueryClient>,
  jobId: string,
) {
  queryClient.invalidateQueries({
    queryKey: ['jobSummary', jobId],
  })
  queryClient.invalidateQueries({
    queryKey: ['jobResume', jobId],
  })
  queryClient.invalidateQueries({
    queryKey: ['jobChecklist', jobId],
  })
  queryClient.invalidateQueries({
    queryKey: ['jobWorkflow', jobId],
  })
}

export function useWorkflowEvents() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribePushState = onWorkflowPushState((payload) => {
      switch (payload.type) {
        case 'stateChanged': {
          const runtimeStore = useWorkflowRuntimeStore.getState()

          if (payload.workflow.status === 'completed') {
            runtimeStore.clearWorkflowState(payload.jobId)
            return
          }

          runtimeStore.setWorkflowState(payload.jobId, payload.workflow)
          return
        }
        case 'taskCompleted': {
          invalidateJob(queryClient, payload.jobId)

          if (payload.taskName === SCORE_UPDATING) {
            queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
          }
          return
        }
        case 'taskFailed': {
          invalidateJob(queryClient, payload.jobId)

          const taskLabel = payload.taskName.toLowerCase().replace(/_/g, ' ')
          toast.error(`Failed: ${taskLabel}`, {
            description: friendlyError(payload.error),
          })
          return
        }
        case 'completed': {
          useWorkflowRuntimeStore.getState().clearWorkflowState(payload.jobId)
          invalidateJob(queryClient, payload.jobId)
          const workflowLabel =
            payload.workflowName === 'tailoring'
              ? 'Tailoring complete'
              : 'Processing complete'

          toast.success(workflowLabel)
          return
        }
      }
    })

    return () => {
      unsubscribePushState()
    }
  }, [queryClient])
}
