import type { Checklist } from '@type/checklist'
import type { Task } from '@workflow/workflow.types'

// Failed tasks map: task name -> ISO timestamp when it failed
export type FailedTasksMap = Partial<Record<Task, string>>

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

export interface CreateFromScratchPayload {
  companyName: string
  position: string
  dueDate: string
  jobDescription?: string
  jobUrl?: string
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
  originalResume: string | null
  createdAt: string
  updatedAt: string
}

export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed'

export interface WorkflowStepsData {
  workflowName: string
  taskStates: Record<string, string>
  status: WorkflowStatus
  error?: string
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
  return window.electron.jobs.create(payload)
}

export function createFromScratch(
  payload: CreateFromScratchPayload,
): Promise<CreateJobApplicationResponse> {
  return window.electron.jobs.createFromScratch(payload)
}

export function createFromExisting(
  payload: CreateFromExistingPayload,
): Promise<CreateJobApplicationResponse> {
  return window.electron.jobs.createFromExisting(payload)
}

export async function getAllJobApplications(): Promise<Array<JobApplication>> {
  return window.electron.jobs.getAll() as Promise<Array<JobApplication>>
}

export async function getJobApplication(
  id: string,
): Promise<JobApplicationDetails> {
  return window.electron.jobs.get(id) as Promise<JobApplicationDetails>
}

export async function updateJobApplication(
  id: string,
  payload: UpdateJobApplicationPayload,
): Promise<void> {
  await window.electron.jobs.update(id, payload)
}

export async function deleteJobApplication(id: string): Promise<void> {
  await window.electron.jobs.delete(id)
}

export async function saveResume(
  jobId: string,
  resumeStructure: Record<string, unknown>,
  templateId: string,
): Promise<GeneralAPIResponse> {
  return window.electron.jobs.saveResume(jobId, { resumeStructure, templateId })
}

// Workflow data operations

export async function saveParsedResume(
  jobId: string,
  parsedResume: Record<string, unknown>,
  tailoredResume: Record<string, unknown>,
): Promise<GeneralAPIResponse> {
  return window.electron.jobs.saveParsedResume(jobId, {
    parsedResume,
    tailoredResume,
  })
}

export async function saveTailoredResume(
  jobId: string,
  tailoredResume: Record<string, unknown>,
): Promise<GeneralAPIResponse> {
  return window.electron.jobs.saveTailoredResume(jobId, { tailoredResume })
}

export async function saveChecklist(
  jobId: string,
  checklist: Checklist,
): Promise<GeneralAPIResponse> {
  return window.electron.jobs.saveChecklist(jobId, { checklist })
}

export async function saveMatchScore(
  jobId: string,
  matchPercentage: number,
): Promise<GeneralAPIResponse> {
  return window.electron.jobs.saveMatchScore(jobId, { matchPercentage })
}

export async function saveWorkflow(
  jobId: string,
  workflowSteps: WorkflowStepsData,
  workflowStatus: string,
): Promise<GeneralAPIResponse> {
  return window.electron.jobs.saveWorkflowState(jobId, {
    workflowSteps,
    workflowStatus,
  })
}

export function updateJobDescription(
  jobId: string,
  jobDescription: string,
): Promise<GeneralAPIResponse> {
  return window.electron.jobs.updateJobDescription(jobId, { jobDescription })
}
