import type { TaskName, WorkflowContext } from "@type/task-contracts";
import type { WorkflowStatus, WorkflowStepsData } from "@type/workflow";

export interface WorkflowStartPayload {
  workflowName: string;
  jobId: string;
  initialContext: Partial<WorkflowContext>;
}

export interface WorkflowRetryPayload {
  jobId: string;
}

export interface WorkflowGetStatePayload {
  jobId: string;
}

export interface WorkflowStartTailoringPayload {
  jobId: string;
  needTailoring: string[];
}

export interface WorkflowBatchEntry {
  jobDescription: string;
  jobUrl?: string;
}

export type WorkflowCreateApplicationsPayload =
  | {
      resumeSource: "upload";
      rawResumeContent: string;
      templateId: string;
      entries: WorkflowBatchEntry[];
    }
  | {
      resumeSource: "existing";
      sourceJobId: string;
      entries: WorkflowBatchEntry[];
    };

export interface WorkflowCreateApplicationsResult {
  createdIds: string[];
  succeeded: number;
  total: number;
}

export interface WorkflowStateChanged {
  jobId: string;
  workflow: WorkflowStepsData;
}

export interface WorkflowTaskCompleted {
  jobId: string;
  taskName: TaskName;
  provides?: string;
  result?: unknown;
}

export interface WorkflowTaskFailed {
  jobId: string;
  taskName: TaskName;
  error: string;
}

export interface WorkflowCompleted {
  jobId: string;
  workflowName: string;
  status: WorkflowStatus;
}

export interface WorkflowAiPartial {
  jobId: string;
  taskName: TaskName;
  partial: unknown;
}
