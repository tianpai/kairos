import type { TaskName } from '@type/task-contracts'
import type { WorkflowStepsData } from '@type/workflow'
import type {
  WorkflowAiPartial,
  WorkflowCompleted,
  WorkflowCreateApplicationsPayload,
  WorkflowCreateApplicationsResult,
  WorkflowGetStatePayload,
  WorkflowRetryPayload,
  WorkflowStartPayload,
  WorkflowStartTailoringPayload,
  WorkflowStateChanged,
  WorkflowTaskCompleted,
  WorkflowTaskFailed,
} from '@type/workflow-ipc'

type Unsubscribe = () => void

export async function startWorkflow(
  payload: WorkflowStartPayload,
): Promise<void> {
  await window.kairos.workflow.start(payload)
}

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

export function onWorkflowStateChanged(
  callback: (payload: WorkflowStateChanged) => void,
): Unsubscribe {
  return window.kairos.workflow.onStateChanged(callback)
}

export function onWorkflowTaskCompleted(
  callback: (payload: WorkflowTaskCompleted) => void,
): Unsubscribe {
  return window.kairos.workflow.onTaskCompleted(callback)
}

export function onWorkflowTaskFailed(
  callback: (payload: WorkflowTaskFailed) => void,
): Unsubscribe {
  return window.kairos.workflow.onTaskFailed(callback)
}

export function onWorkflowCompleted(
  callback: (payload: WorkflowCompleted) => void,
): Unsubscribe {
  return window.kairos.workflow.onCompleted(callback)
}

export function onWorkflowAiPartial(
  callback: (payload: WorkflowAiPartial) => void,
): Unsubscribe {
  return window.kairos.workflow.onAiPartial(callback)
}
