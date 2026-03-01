import {
  getWorkflowState as getWorkflowStateApi,
  onWorkflowTaskCompleted,
  onWorkflowTaskFailed,
  retryWorkflow as retryWorkflowApi,
  startWorkflow as startWorkflowApi,
} from '@api/workflow'
import { useWorkflowStore } from './workflow.store'
import type { TaskName, WorkflowContext } from '@type/task-contracts'
import type { WorkflowStepsData } from '@type/workflow'

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
  await startWorkflowApi({ workflowName, jobId, initialContext })
}

export async function retryFailedTasks(jobId: string): Promise<TaskName[]> {
  return retryWorkflowApi({ jobId })
}

export async function getWorkflowState(
  jobId: string,
): Promise<WorkflowStepsData | null> {
  return getWorkflowStateApi({ jobId })
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

    const unsubscribeCompleted = onWorkflowTaskCompleted((payload) => {
      if (payload.jobId === jobId && payload.taskName === taskName) {
        unsubscribeCompleted()
        unsubscribeFailed()
        resolve()
      }
    })

    const unsubscribeFailed = onWorkflowTaskFailed((payload) => {
      if (payload.jobId === jobId && payload.taskName === taskName) {
        unsubscribeCompleted()
        unsubscribeFailed()
        reject(new Error(`Task ${taskName} failed`))
      }
    })
  })
}
