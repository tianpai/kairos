import type { Checklist } from './checklist'
import type { WorkflowStatus, WorkflowStepsData } from './workflow'

export interface JobsCreatePayload {
  rawResumeContent: string
  jobDescription: string
  companyName: string
  position: string
  dueDate: string
  jobUrl?: string
  templateId: string
}

export interface JobsCreateFromExistingPayload {
  sourceJobId: string
  companyName: string
  position: string
  dueDate: string
  jobDescription: string
  jobUrl?: string
  templateId: string
}

export interface JobsCreateResult {
  id: string
}

export interface JobApplication {
  id: string
  companyName: string
  position: string
  dueDate: string
  matchPercentage: number
  applicationStatus: string | null
  jobUrl: string | null
  originalResume: string
  pinned: number
  pinnedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface FailedTaskInfo {
  status: 'failed'
}

export type FailedTasksMap = Record<string, FailedTaskInfo>

export interface JobApplicationDetails extends JobApplication {
  templateId: string
  jobDescription: string | null
  parsedResume: Record<string, unknown> | null
  tailoredResume: Record<string, unknown> | null
  checklist: Checklist | null
  workflowStatus: WorkflowStatus | null
  workflowSteps: WorkflowStepsData | null
  failedTasks: FailedTasksMap
}

export interface JobsListQuery {
  archived?: boolean
}

export interface JobsPatchPayload {
  companyName?: string
  position?: string
  dueDate?: string
  jobUrl?: string | null
  jobDescription?: string
  pinned?: boolean
  archived?: boolean
  applicationStatus?: string | null
}
