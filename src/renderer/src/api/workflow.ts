import type {
  WfState,
  WorkflowAiPartial,
  WorkflowPushState,
} from '@type/workflow'

type Unsubscribe = () => void

export async function startWorkflow(
  jobId: string,
  workflowName: string,
): Promise<void> {
  await window.kairos.workflow.start(jobId, workflowName)
}

export async function retryWorkflow(jobId: string): Promise<void> {
  await window.kairos.workflow.retry(jobId)
}

export async function getWorkflowState(jobId: string): Promise<WfState | null> {
  return window.kairos.workflow.getState(jobId)
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
