export type TaskName =
  | "resume.parsing"
  | "resume.tailoring"
  | "checklist.parsing"
  | "checklist.matching"
  | "score.updating"
  | "jobinfo.extracting";

export interface TaskError {
  message: string;
  retryable: boolean;
}

export interface TaskState {
  status: "pending" | "running" | "completed" | "failed";
  error?: TaskError;
}

export interface WfState {
  workflowName: string;
  tasks: Record<TaskName, TaskState>;
}

export interface WorkflowPushState {
  jobId: string;
  state: WfState | null;
}

export interface WorkflowAiPartial {
  jobId: string;
  taskName: TaskName;
  partial: unknown;
}
