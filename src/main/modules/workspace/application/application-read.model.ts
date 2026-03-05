import type { JobApplicationDetails } from "@type/jobs-ipc";
import type { WorkflowStatus } from "@type/workflow";

export type WorkflowState = Record<string, unknown>;

function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return (
    value === "idle" ||
    value === "running" ||
    value === "completed" ||
    value === "failed"
  );
}

export function getWorkflowDetails(state: WorkflowState | null): {
  workflowSteps: JobApplicationDetails["workflowSteps"];
  workflowStatus: JobApplicationDetails["workflowStatus"];
} {
  const workflowSteps =
    (state as JobApplicationDetails["workflowSteps"] | null) ?? null;
  const status = workflowSteps?.status;
  return {
    workflowSteps,
    workflowStatus: isWorkflowStatus(status) ? status : null,
  };
}
