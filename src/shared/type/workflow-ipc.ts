import type { TaskName, WorkflowContext } from '@type/task-contracts'
import type { WorkflowStatus, WorkflowStepsData } from '@type/workflow'

export interface WorkflowStartPayload {
  workflowName: string
  jobId: string
  initialContext: Partial<WorkflowContext>
}

export interface WorkflowRetryPayload {
  jobId: string
}

export interface WorkflowGetStatePayload {
  jobId: string
}

export interface WorkflowStateChanged {
  jobId: string
  workflow: WorkflowStepsData
}

export interface WorkflowTaskCompleted {
  jobId: string
  taskName: TaskName
  provides?: string
  result?: unknown
  tipEvent?: string
  tipData?: Record<string, unknown>
}

export interface WorkflowTaskFailed {
  jobId: string
  taskName: TaskName
  error: string
}

export interface WorkflowCompleted {
  jobId: string
  workflowName: string
  status: WorkflowStatus
  tipEvent?: string
  tipData?: Record<string, unknown>
}

export interface WorkflowAiPartial {
  jobId: string
  taskName: TaskName
  partial: unknown
}
