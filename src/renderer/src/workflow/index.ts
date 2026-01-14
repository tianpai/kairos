import { useWorkflowStore } from './workflow.store'
import type { TaskName, WorkflowContext } from '@type/task-contracts'
import type { WorkflowStepsData } from '@type/workflow'
import type {
  WorkflowGetStatePayload,
  WorkflowRetryPayload,
  WorkflowStartPayload,
} from '@type/workflow-ipc'

// Types
export type {
  TaskName,
  TaskInput,
  TaskOutput,
  WorkflowContext,
} from '@type/task-contracts'

// Task name constants (re-exported from isolated file for worker compatibility)
export {
  RESUME_PARSING,
  RESUME_TAILORING,
  CHECKLIST_PARSING,
  CHECKLIST_MATCHING,
  SCORE_UPDATING,
  JOBINFO_EXTRACTING,
} from './task-names'

// Store
export { useWorkflowStore } from './workflow.store'
export type {
  TaskStatus,
  WorkflowStatus,
  WorkflowInstance,
  TaskStateMap,
} from './workflow.store'

export async function startWorkflow(
  workflowName: string,
  jobId: string,
  initialContext: Partial<WorkflowContext>,
): Promise<void> {
  const payload: WorkflowStartPayload = { workflowName, jobId, initialContext }
  await window.kairos.workflow.start(payload)
}

export async function retryFailedTasks(
  jobId: string,
): Promise<Array<TaskName>> {
  const payload: WorkflowRetryPayload = { jobId }
  const result = await window.kairos.workflow.retry(payload)
  return result.failedTasks as Array<TaskName>
}

export async function getWorkflowState(
  jobId: string,
): Promise<WorkflowStepsData | null> {
  const payload: WorkflowGetStatePayload = { jobId }
  const result = await window.kairos.workflow.getState(payload)
  return result.workflow ?? null
}

/**
 * Wait for a specific task to complete (based on IPC events).
 */
export function waitForTask(jobId: string, taskName: TaskName): Promise<void> {
  return new Promise((resolve, reject) => {
    const store = useWorkflowStore.getState()
    const workflow = store.getWorkflow(jobId)

    // Check if already completed
    if (workflow?.taskStates[taskName] === 'completed') {
      resolve()
      return
    }

    // Check if already failed
    if (workflow?.taskStates[taskName] === 'failed') {
      reject(new Error(`Task ${taskName} failed`))
      return
    }

    const unsubscribeCompleted = window.kairos.workflow.onTaskCompleted(
      (payload) => {
        if (payload.jobId === jobId && payload.taskName === taskName) {
          unsubscribeCompleted()
          unsubscribeFailed()
          resolve()
        }
      },
    )

    const unsubscribeFailed = window.kairos.workflow.onTaskFailed((payload) => {
      if (payload.jobId === jobId && payload.taskName === taskName) {
        unsubscribeCompleted()
        unsubscribeFailed()
        reject(new Error(`Task ${taskName} failed`))
      }
    })
  })
}
