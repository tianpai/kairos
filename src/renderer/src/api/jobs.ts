import type { Checklist } from '@type/checklist'
import type { TaskName } from '../workflow'
import type { WorkflowStatus, WorkflowStepsData } from '@type/workflow'

// Failed tasks map: task name -> ISO timestamp when it failed
export type FailedTasksMap = Partial<Record<TaskName, string>>

export interface CreateJobApplicationResponse {
  id: string
}

export interface JobApplicationInput {
  rawResumeContent: string
  jobDescription: string
  companyName: string
  position: string
  dueDate: string
  jobUrl?: string
}

export interface CreateJobApplicationPayload extends JobApplicationInput {
  templateId: string
}

export interface CreateFromExistingPayload {
  sourceJobId: string
  companyName: string
  position: string
  dueDate: string
  jobDescription: string
  jobUrl?: string
  templateId: string
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
  createdAt: string
  updatedAt: string
}

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

export interface GeneralAPIResponse {
  success: boolean
}

export interface UpdateJobApplicationPayload {
  companyName: string
  position: string
  dueDate: string
  jobUrl?: string | null
}

// CRUD operations

export async function createJobApplication(
  payload: CreateJobApplicationPayload,
): Promise<CreateJobApplicationResponse> {
  return window.kairos.jobs.create(payload)
}

export function createFromExisting(
  payload: CreateFromExistingPayload,
): Promise<CreateJobApplicationResponse> {
  return window.kairos.jobs.createFromExisting(payload)
}

export async function getAllJobApplications(): Promise<Array<JobApplication>> {
  return window.kairos.jobs.getAll() as Promise<Array<JobApplication>>
}

export async function getJobApplication(
  id: string,
): Promise<JobApplicationDetails> {
  return window.kairos.jobs.get(id) as Promise<JobApplicationDetails>
}

export async function updateJobApplication(
  id: string,
  payload: UpdateJobApplicationPayload,
): Promise<void> {
  await window.kairos.jobs.update(id, payload)
}

export async function deleteJobApplication(id: string): Promise<void> {
  await window.kairos.jobs.delete(id)
}

export async function saveResume(
  jobId: string,
  resumeStructure: Record<string, unknown>,
  templateId: string,
): Promise<GeneralAPIResponse> {
  return window.kairos.jobs.saveResume(jobId, { resumeStructure, templateId })
}

export function updateJobDescription(
  jobId: string,
  jobDescription: string,
): Promise<GeneralAPIResponse> {
  return window.kairos.jobs.updateJobDescription(jobId, { jobDescription })
}
