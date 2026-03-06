import type { WorkflowStatus, WorkflowStepsData } from "@type/workflow";

type WorkflowState = Record<string, unknown>;

function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return (
    value === "idle" ||
    value === "running" ||
    value === "completed" ||
    value === "failed"
  );
}

export function getWorkflowDetails(state: WorkflowState | null): {
  workflowSteps: WorkflowStepsData | null;
  workflowStatus: WorkflowStatus | null;
} {
  const workflowSteps = (state as WorkflowStepsData | null) ?? null;
  const status = workflowSteps?.status;

  return {
    workflowSteps,
    workflowStatus: isWorkflowStatus(status) ? status : null,
  };
}
