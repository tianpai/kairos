import type {
  JobApplication,
  JobSummary,
  JobsListQuery,
  JobsPatchPayload,
} from '@type/jobs-ipc'
import type { Checklist } from '@type/checklist'
import type { IpcSuccessResponse } from '@type/ipc'
import type { WorkflowStepsData } from '@type/workflow'

export type { JobApplication, JobSummary } from '@type/jobs-ipc'

export type PatchJobApplicationPayload = JobsPatchPayload
export interface JobResumeRecord {
  templateId: string
  jobDescription: string | null
  originalResume: string
  parsedResume: Record<string, unknown> | null
  tailoredResume: Record<string, unknown> | null
}

// CRUD operations

export async function listJobApplications(
  query: JobsListQuery = {},
): Promise<JobApplication[]> {
  return window.kairos.jobs.list(query)
}

// TODO: rename it to getJobSummary
export function getJobApplicationSummary(id: string): Promise<JobSummary> {
  return window.kairos.jobs.get(id)
}

// TODO: rename it to getResume
export function getJobResume(id: string): Promise<JobResumeRecord> {
  return window.kairos.resume.get(id)
}

// TODO: rename it to getChecklist
export function getJobChecklist(id: string): Promise<Checklist | null> {
  return window.kairos.checklist.get(id)
}

// TODO: rename it to getWorkflow
export async function getJobWorkflow(
  id: string,
): Promise<WorkflowStepsData | null> {
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
