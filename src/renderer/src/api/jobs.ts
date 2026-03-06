import type {
  JobApplication,
  JobApplicationSummary,
  JobsCreateFromExistingPayload,
  JobsCreatePayload,
  JobsCreateResult,
  JobsListQuery,
  JobsPatchPayload,
} from '@type/jobs-ipc'
import type { Checklist } from '@type/checklist'
import type { IpcSuccessResponse } from '@type/ipc'
import type { WorkflowStepsData } from '@type/workflow'

export type CreateJobApplicationPayload = JobsCreatePayload
export type CreateFromExistingPayload = JobsCreateFromExistingPayload
export type CreateJobApplicationResponse = JobsCreateResult
export type { JobApplication, JobApplicationSummary } from '@type/jobs-ipc'

export type PatchJobApplicationPayload = JobsPatchPayload
export interface JobResumeRecord {
  templateId: string
  jobDescription: string | null
  originalResume: string
  parsedResume: Record<string, unknown> | null
  tailoredResume: Record<string, unknown> | null
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

export async function listJobApplications(
  query: JobsListQuery = {},
): Promise<JobApplication[]> {
  return window.kairos.jobs.list(query)
}

export function getJobApplicationSummary(
  id: string,
): Promise<JobApplicationSummary> {
  return window.kairos.jobs.get(id)
}

export function getJobResume(id: string): Promise<JobResumeRecord> {
  return window.kairos.resume.get(id)
}

export function getJobChecklist(id: string): Promise<Checklist | null> {
  return window.kairos.checklist.get(id)
}

export async function getJobWorkflow(id: string): Promise<WorkflowStepsData | null> {
  const result = await window.kairos.workflow.getState({ jobId: id })
  return result.workflow ?? null
}

export async function deleteJobApplication(id: string): Promise<void> {
  await window.kairos.jobs.delete(id)
}

export function patchJobApplication(
  id: string,
  payload: PatchJobApplicationPayload,
): Promise<IpcSuccessResponse> {
  return window.kairos.jobs.patch(id, payload)
}

export async function saveResume(
  jobId: string,
  resumeStructure: Record<string, unknown>,
  templateId: string,
): Promise<IpcSuccessResponse> {
  return window.kairos.resume.save(jobId, { resumeStructure, templateId })
}
