import type { TaskName } from '@type/task-contracts'
import type { WorkflowStepsData } from '@type/workflow'
import type {
  WorkflowAiPartial,
  WorkflowCreateApplicationsPayload,
  WorkflowCreateApplicationsResult,
  WorkflowGetStatePayload,
  WorkflowPushState,
  WorkflowRetryPayload,
  WorkflowStartTailoringPayload,
} from '@type/workflow-ipc'

type Unsubscribe = () => void

export async function startTailoring(
  payload: WorkflowStartTailoringPayload,
): Promise<void> {
  await window.kairos.workflow.startTailoring(payload)
}

export async function retryWorkflow(
  payload: WorkflowRetryPayload,
): Promise<TaskName[]> {
  const result = await window.kairos.workflow.retry(payload)
  return result.failedTasks as TaskName[]
}

export function createApplications(
  payload: WorkflowCreateApplicationsPayload,
): Promise<WorkflowCreateApplicationsResult> {
  return window.kairos.workflow.createApplications(payload)
}

export async function getWorkflowState(
  payload: WorkflowGetStatePayload,
): Promise<WorkflowStepsData | null> {
  const result = await window.kairos.workflow.getState(payload)
  return result.workflow ?? null
}

export function onWorkflowPushState(
  callback: (payload: WorkflowPushState) => void,
): Unsubscribe {
  return window.kairos.workflow.onPushState(callback)
}

export function onWorkflowAiPartial(
  callback: (payload: WorkflowAiPartial) => void,
): Unsubscribe {
  return window.kairos.workflow.onAiPartial(callback)
}
