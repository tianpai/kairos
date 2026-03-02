import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  onWorkflowCompleted,
  onWorkflowStateChanged,
  onWorkflowTaskCompleted,
  onWorkflowTaskFailed,
} from '@api/workflow'
import { SCORE_UPDATING } from '@type/task-names'
import { friendlyError } from '@/utils/error'
import { useWorkflowRuntimeStore } from './workflowRuntime.store'

function invalidateJob(
  queryClient: ReturnType<typeof useQueryClient>,
  jobId: string,
) {
  queryClient.invalidateQueries({
    queryKey: ['jobApplication', jobId],
  })
}

export function useWorkflowEvents() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribeState = onWorkflowStateChanged((payload) => {
      const runtimeStore = useWorkflowRuntimeStore.getState()

      if (payload.workflow.status === 'completed') {
        runtimeStore.clearWorkflowState(payload.jobId)
        return
      }

      runtimeStore.setWorkflowState(payload.jobId, payload.workflow)
    })

    const unsubscribeTaskCompleted = onWorkflowTaskCompleted((payload) => {
      invalidateJob(queryClient, payload.jobId)

      if (payload.taskName === SCORE_UPDATING) {
        queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      }
    })

    const unsubscribeTaskFailed = onWorkflowTaskFailed((payload) => {
      invalidateJob(queryClient, payload.jobId)

      const taskLabel = payload.taskName.toLowerCase().replace(/_/g, ' ')
      toast.error(`Failed: ${taskLabel}`, {
        description: friendlyError(payload.error),
      })
    })

    const unsubscribeCompleted = onWorkflowCompleted((payload) => {
      useWorkflowRuntimeStore.getState().clearWorkflowState(payload.jobId)
      invalidateJob(queryClient, payload.jobId)
      const workflowLabel =
        payload.workflowName === 'tailoring'
          ? 'Tailoring complete'
          : 'Processing complete'

      toast.success(workflowLabel)
    })

    return () => {
      unsubscribeState()
      unsubscribeTaskCompleted()
      unsubscribeTaskFailed()
      unsubscribeCompleted()
    }
  }, [queryClient])
}
