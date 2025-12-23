import type { WorkflowStepsData } from '@api/jobs'

/**
 * Detect and fix stale "running" states from interrupted workflows.
 * Called when loading workflow state from DB on app start/navigation.
 *
 * If the workflow was "running" in DB, it means the app was closed/crashed
 * mid-workflow. We mark it as "failed" so the user can retry later.
 *
 * @returns The recovered workflow steps (possibly modified) and whether recovery was needed
 */
export function recoverStaleWorkflow(workflowSteps: WorkflowStepsData): {
  recovered: WorkflowStepsData
  wasStale: boolean
} {
  // If workflow wasn't running, no recovery needed
  if (workflowSteps.status !== 'running') {
    return { recovered: workflowSteps, wasStale: false }
  }

  // Workflow was "running" - mark as failed (interrupted)
  const recoveredTaskStates: Record<string, string> = {}

  for (const [task, status] of Object.entries(workflowSteps.taskStates)) {
    // Mark any "running" tasks as "failed" (they were interrupted)
    recoveredTaskStates[task] = status === 'running' ? 'failed' : status
  }

  return {
    recovered: {
      ...workflowSteps,
      status: 'failed',
      taskStates: recoveredTaskStates,
      error: 'Workflow was interrupted',
    },
    wasStale: true,
  }
}
