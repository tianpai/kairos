import type { TaskName } from "@type/task-contracts";
import type { WorkflowStatus, WorkflowStepsData } from "@type/workflow";

export interface WorkflowStartPayload {
  jobId: string;
  // TODO: (workflow) Replace with a shared WorkflowName union to prevent
  // invalid strings from renderer/preload callers.
  workflowName: string;
}

// TODO: consider a more unified and simple state
export type WorkflowPushState =
  | { type: "stateChanged"; jobId: string; workflow: WorkflowStepsData }
  | { type: "taskCompleted"; jobId: string; taskName: TaskName }
  | { type: "taskFailed"; jobId: string; taskName: TaskName; error: string }
  | {
      type: "completed";
      jobId: string;
      workflowName: string;
      status: WorkflowStatus;
    };

export interface WorkflowAiPartial {
  jobId: string;
  taskName: TaskName;
  partial: unknown;
}
