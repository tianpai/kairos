import type {
  JobApplication,
  JobApplicationDetails,
  JobsCreateFromExistingPayload,
  JobsCreatePayload,
  JobsCreateResult,
  JobsListQuery,
  JobsPatchPayload,
} from '@type/jobs-ipc'
import type { IpcSuccessResponse } from '@type/ipc'

export type CreateJobApplicationPayload = JobsCreatePayload
export type CreateFromExistingPayload = JobsCreateFromExistingPayload
export type CreateJobApplicationResponse = JobsCreateResult
export type { JobApplication, JobApplicationDetails } from '@type/jobs-ipc'

export type PatchJobApplicationPayload = JobsPatchPayload

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
): Promise<Array<JobApplication>> {
  return window.kairos.jobs.list(query)
}

export async function getJobApplication(
  id: string,
): Promise<JobApplicationDetails> {
  return window.kairos.jobs.get(id)
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
  return window.kairos.jobs.saveResume(jobId, { resumeStructure, templateId })
}
