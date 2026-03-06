import type { Checklist } from "./checklist";
import type { WorkflowStatus, WorkflowStepsData } from "./workflow";

export interface JobsCreatePayload {
  rawResumeContent: string;
  jobDescription: string;
  companyName: string;
  position: string;
  dueDate: string;
  jobUrl?: string;
  templateId: string;
}

export interface JobsCreateFromExistingPayload {
  sourceJobId: string;
  companyName: string;
  position: string;
  dueDate: string;
  jobDescription: string;
  jobUrl?: string;
  templateId: string;
}

export interface JobsCreateResult {
  id: string;
}

export interface JobSummary {
  id: string;
  companyName: string;
  position: string;
  dueDate: string;
  matchPercentage: number;
  applicationStatus: string | null;
  jobUrl: string | null;
  pinned: number;
  pinnedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication extends JobSummary {
  originalResume: string;
}

export interface FailedTaskInfo {
  status: "failed";
}

export type FailedTasksMap = Record<string, FailedTaskInfo>;

export interface JobApplicationDetails extends JobSummary {
  templateId: string;
  jobDescription: string | null;
  originalResume: string;
  parsedResume: Record<string, unknown> | null;
  tailoredResume: Record<string, unknown> | null;
  checklist: Checklist | null;
  workflowStatus: WorkflowStatus | null;
  workflowSteps: WorkflowStepsData | null;
  failedTasks: FailedTasksMap;
}

export interface JobsListQuery {
  archived?: boolean;
}

export interface JobsPatchPayload {
  companyName?: string;
  position?: string;
  dueDate?: string;
  jobUrl?: string | null;
  jobDescription?: string;
  pinned?: boolean;
  archived?: boolean;
  applicationStatus?: string | null;
}
