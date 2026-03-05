import { randomUUID } from "node:crypto";
import { getWorkflowDetails } from "./application-read.model";
import type {
  JobApplication,
  JobApplicationDetails,
  JobsCreateResult,
} from "@type/jobs-ipc";
import type { IpcSuccessResponse } from "@type/ipc";
import type {
  CreateFromExistingInput,
  CreateJobApplicationInput,
  ListJobsInput,
  PatchJobApplicationInput,
  SaveChecklistInput,
  SaveParsedResumeInput,
  SaveResumeInput,
  SaveTailoredResumeInput,
  SaveWorkflowStateInput,
} from "../../../schemas/job-application.schemas";
import type {
  WorkspaceApplicationRecord,
  WorkspaceJobUpdate,
  WorkspacePersistencePort,
} from "../workspace.persistence";

export class JobNotFoundError extends Error {
  constructor(id: string) {
    super(`Job application with ID ${id} not found`);
    this.name = "JobNotFoundError";
  }
}

function nowISO(): string {
  return new Date().toISOString();
}

function toDateOnly(value: string): string {
  return value.split("T")[0];
}

export class WorkspaceApplicationService {
  constructor(private readonly persistence: WorkspacePersistencePort) {}

  private ensureJobExists(jobId: string): void {
    if (!this.persistence.hasJob(jobId)) {
      throw new JobNotFoundError(jobId);
    }
  }

  private requireJobApplication(id: string): WorkspaceApplicationRecord {
    const row = this.persistence.getApplicationRecord(id);

    if (!row) throw new JobNotFoundError(id);

    return row;
  }

  private success(): IpcSuccessResponse {
    return { success: true };
  }

  async createJobApplication(
    dto: CreateJobApplicationInput,
  ): Promise<JobsCreateResult> {
    const jobId = randomUUID();
    const now = nowISO();

    this.persistence.insertApplication({
      id: jobId,
      companyName: dto.companyName,
      position: dto.position,
      dueDate: dto.dueDate,
      jobUrl: dto.jobUrl ?? null,
      templateId: dto.templateId,
      originalResume: dto.rawResumeContent,
      parsedResume: null,
      tailoredResume: null,
      jobDescription: dto.jobDescription,
      createdAt: now,
      updatedAt: now,
    });

    return { id: jobId };
  }

  async createFromExisting(
    dto: CreateFromExistingInput,
  ): Promise<JobsCreateResult> {
    const sourceJob = this.requireJobApplication(dto.sourceJobId);
    const jobId = randomUUID();
    const now = nowISO();

    this.persistence.insertApplication({
      id: jobId,
      companyName: dto.companyName,
      position: dto.position,
      dueDate: dto.dueDate,
      jobUrl: dto.jobUrl ?? null,
      templateId: dto.templateId,
      originalResume: sourceJob.originalResume ?? "",
      parsedResume: sourceJob.parsedResume,
      tailoredResume: sourceJob.parsedResume,
      jobDescription: dto.jobDescription,
      createdAt: now,
      updatedAt: now,
    });

    return { id: jobId };
  }

  async listJobApplications(
    query: ListJobsInput = {},
  ): Promise<JobApplication[]> {
    const archived = query.archived ?? false;
    return this.persistence.listApplications(archived);
  }

  async getJobApplication(id: string): Promise<JobApplicationDetails> {
    const job = this.requireJobApplication(id);
    const { workflowSteps, workflowStatus } = getWorkflowDetails(
      job.workflowState,
    );

    const failedTasks: JobApplicationDetails["failedTasks"] = {};
    if (workflowSteps?.taskStates) {
      Object.entries(workflowSteps.taskStates).forEach(([task, status]) => {
        if (status === "failed") {
          failedTasks[task] = { status: "failed" };
        }
      });
    }

    return {
      id: job.id,
      companyName: job.companyName,
      position: job.position,
      dueDate: toDateOnly(job.dueDate),
      matchPercentage: job.matchPercentage ?? 0,
      applicationStatus: job.applicationStatus,
      jobUrl: job.jobUrl,
      originalResume: job.originalResume ?? "",
      pinned: job.pinned,
      pinnedAt: job.pinnedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      templateId: job.templateId ?? "",
      jobDescription: job.jobDescription,
      parsedResume: job.parsedResume ?? null,
      tailoredResume: job.tailoredResume ?? null,
      checklist: (job.checklist as JobApplicationDetails["checklist"]) ?? null,
      workflowStatus,
      workflowSteps,
      failedTasks,
    };
  }

  async deleteJobApplication(id: string): Promise<IpcSuccessResponse> {
    this.ensureJobExists(id);
    this.persistence.deleteApplication(id);
    return this.success();
  }

  deleteAllJobApplications(): IpcSuccessResponse {
    this.persistence.deleteAllApplications();
    return this.success();
  }

  async saveResume(
    jobId: string,
    dto: SaveResumeInput,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);
    this.persistence.saveResume(jobId, dto);
    return this.success();
  }

  async saveParsedResume(
    jobId: string,
    dto: SaveParsedResumeInput,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);
    this.persistence.saveParsedResume(jobId, dto);
    return this.success();
  }

  async saveTailoredResume(
    jobId: string,
    dto: SaveTailoredResumeInput,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);
    this.persistence.saveTailoredResume(jobId, dto);
    return this.success();
  }

  async saveChecklist(
    jobId: string,
    dto: SaveChecklistInput,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);
    this.persistence.saveChecklist(jobId, dto);
    return this.success();
  }

  async saveMatchScore(
    jobId: string,
    matchPercentage: number,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);
    this.persistence.saveMatchScore(jobId, matchPercentage);
    return this.success();
  }

  async saveWorkflowState(
    jobId: string,
    dto: SaveWorkflowStateInput,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);
    this.persistence.saveWorkflowState(jobId, dto);
    return this.success();
  }

  async patchJobApplication(
    jobId: string,
    dto: PatchJobApplicationInput,
  ): Promise<IpcSuccessResponse> {
    const current = this.requireJobApplication(jobId);
    const updateData: WorkspaceJobUpdate = {
      updatedAt: nowISO(),
    };

    if (
      dto.companyName !== undefined &&
      dto.companyName !== current.companyName
    ) {
      updateData.companyId = this.persistence.getOrCreateCompanyId(
        dto.companyName,
      );
    }
    if (dto.position !== undefined) {
      updateData.position = dto.position;
    }
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate;
    }
    if (dto.jobUrl !== undefined) {
      updateData.jobUrl = dto.jobUrl;
    }
    if (dto.pinned !== undefined) {
      updateData.pinned = dto.pinned ? 1 : 0;
      updateData.pinnedAt = dto.pinned ? nowISO() : null;
    }
    if (dto.archived !== undefined) {
      updateData.archived = dto.archived ? 1 : 0;
    }
    if (dto.applicationStatus !== undefined) {
      updateData.applicationStatus = dto.applicationStatus;
      updateData.statusUpdatedAt = dto.applicationStatus ? nowISO() : null;
    }

    this.persistence.updateApplication(jobId, updateData, dto.jobDescription);

    return this.success();
  }
}

export { WorkspaceApplicationService as JobApplicationService };
