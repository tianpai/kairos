import { randomUUID } from "node:crypto";
import { ChecklistSchema } from "@type/checklist";
import type { Checklist } from "@type/checklist";
import type {
  JobApplication,
  JobSummary,
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

  private parseChecklist(
    rawChecklist: Record<string, unknown> | null,
  ): Checklist | null {
    if (!rawChecklist) {
      return null;
    }

    const parsed = ChecklistSchema.safeParse(rawChecklist);
    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  }

  /**
   * ensureJobExists checks if jobid exists and throw an error if not
   */
  private ensureJobExists(jobId: string): void {
    if (!this.persistence.hasJob(jobId)) {
      throw new JobNotFoundError(jobId);
    }
  }

  // FIX: remove it replace its usage with direct check instead
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
    // TODO: requireJobApplication is over fetching
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

  async getJobApplication(id: string): Promise<JobSummary> {
    const job = this.persistence.getJobSummary(id);
    if (!job) {
      throw new JobNotFoundError(id);
    }

    return {
      id: job.id,
      companyName: job.companyName,
      position: job.position,
      dueDate: toDateOnly(job.dueDate),
      matchPercentage: job.matchPercentage ?? 0,
      applicationStatus: job.applicationStatus,
      jobUrl: job.jobUrl,
      pinned: job.pinned,
      pinnedAt: job.pinnedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async getResume(jobId: string): Promise<{
    templateId: string;
    jobDescription: string | null;
    originalResume: string;
    parsedResume: Record<string, unknown> | null;
    tailoredResume: Record<string, unknown> | null;
  }> {
    const resume = this.persistence.getResumeRecord(jobId);
    if (!resume) {
      throw new JobNotFoundError(jobId);
    }

    return {
      templateId: resume.templateId ?? "",
      jobDescription: resume.jobDescription,
      originalResume: resume.originalResume ?? "",
      parsedResume: resume.parsedResume ?? null,
      tailoredResume: resume.tailoredResume ?? null,
    };
  }

  async getTemplateId(jobId: string): Promise<string> {
    const resume = this.persistence.getResumeRecord(jobId);
    if (!resume) {
      throw new JobNotFoundError(jobId);
    }

    return resume.templateId ?? "";
  }

  async getChecklist(jobId: string): Promise<Checklist | null> {
    const row = this.persistence.getChecklistRecord(jobId);
    if (!row) {
      throw new JobNotFoundError(jobId);
    }

    return this.parseChecklist(row.checklist);
  }

  async getChecklistKw(jobId: string): Promise<string[]> {
    const checklist = await this.getChecklist(jobId);
    return checklist?.needTailoring ?? [];
  }

  async updateChecklistNeedTailoring(
    jobId: string,
    keywords: string[],
  ): Promise<IpcSuccessResponse> {
    const row = this.persistence.getChecklistRecord(jobId);
    if (!row) {
      throw new JobNotFoundError(jobId);
    }

    const checklist = this.parseChecklist(row.checklist);
    if (!checklist) {
      throw new Error("Checklist is missing for this job");
    }

    this.persistence.saveChecklist(jobId, {
      checklist: {
        ...checklist,
        needTailoring: this.deduplicateKeywords(keywords),
      },
    });

    return this.success();
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
    // TODO: requireJobApplication is overfetching only companyName is used
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

  private deduplicateKeywords(kw: string[]): string[] {
    const s = new Set<string>();
    return kw
      .map((k) => k.trim())
      .filter((k) => k && !s.has(k.toLowerCase()) && s.add(k.toLowerCase()));
  }
}

export { WorkspaceApplicationService as JobApplicationService };
