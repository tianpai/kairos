export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'
export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed'

export interface WorkflowStepsData {
  workflowName: string
  taskStates: Record<string, TaskStatus>
  status: WorkflowStatus
  error?: string
}
