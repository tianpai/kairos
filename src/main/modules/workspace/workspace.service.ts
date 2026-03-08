import { ChecklistSchema } from "@type/checklist";
import {
  ChecklistRepository,
  JobRepository,
  ResumeRepository,
  jobs,
} from "../persistence";
import type { Checklist } from "@type/checklist";
import type { PersistenceSchema } from "../persistence";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type {
  JobSummary,
  ListJobsInput,
  PatchJobApplicationInput,
  SaveResumeInput,
} from "@type/jobs-ipc";
import type { IpcSuccessResponse } from "@type/ipc";

export { JobNotFoundError, WorkspaceService };

type Database = BetterSQLite3Database<PersistenceSchema>;

class JobNotFoundError extends Error {
  constructor(id: string) {
    super(`Job application with ID ${id} not found`);
    this.name = "JobNotFoundError";
  }
}

function nowISO(): string {
  return new Date().toISOString();
}

class WorkspaceService {
  private readonly repos;

  constructor(private readonly db: Database) {
    this.repos = {
      job: new JobRepository(db),
      resume: new ResumeRepository(db),
      checklist: new ChecklistRepository(db),
    };
  }

  private parseChecklist(rawChecklist: Checklist | null): Checklist | null {
    if (!rawChecklist) {
      return null;
    }

    const parsed = ChecklistSchema.safeParse(rawChecklist);
    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  }

  private requireJob(jobId: string): void {
    if (!this.repos.job.findByJobId(jobId)) {
      throw new JobNotFoundError(jobId);
    }
  }

  private touchJob(jobId: string): void {
    this.repos.job.updateByJobId(jobId, { updatedAt: nowISO() });
  }

  private success(): IpcSuccessResponse {
    return { success: true };
  }

  async listJobApplications(query: ListJobsInput = {}): Promise<JobSummary[]> {
    const archived = query.archived ?? false;
    return this.repos.job.getSummaries({ archived });
  }

  async getJobApplication(id: string): Promise<JobSummary> {
    const job = this.repos.job.getSummary(id);
    if (!job) {
      throw new JobNotFoundError(id);
    }

    return job;
  }

  async getResume(jobId: string): Promise<{
    templateId: string;
    jobDescription: string | null;
    originalResume: string;
    parsedResume: Record<string, unknown> | null;
    tailoredResume: Record<string, unknown> | null;
  }> {
    const resume = this.repos.resume.findByJobId(jobId);
    if (!resume) {
      throw new JobNotFoundError(jobId);
    }

    const cl = this.repos.checklist.findByJobId(jobId);

    return {
      templateId: resume.templateId ?? "",
      jobDescription: cl?.jobDescription ?? null,
      originalResume: resume.originalResume ?? "",
      parsedResume: resume.parsedResume ?? null,
      tailoredResume: resume.tailoredResume ?? null,
    };
  }

  async getTemplateId(jobId: string): Promise<string> {
    const resume = this.repos.resume.findByJobId(jobId);
    if (!resume) {
      throw new JobNotFoundError(jobId);
    }

    return resume.templateId ?? "";
  }

  async getChecklist(jobId: string): Promise<Checklist | null> {
    const row = this.repos.checklist.findByJobId(jobId);
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
    const row = this.repos.checklist.findByJobId(jobId);
    if (!row) {
      throw new JobNotFoundError(jobId);
    }

    const checklist = this.parseChecklist(row.checklist);
    if (!checklist) {
      throw new Error("Checklist is missing for this job");
    }

    this.repos.checklist.updateByJobId(jobId, {
      checklist: {
        ...checklist,
        needTailoring: this.deduplicateKeywords(keywords),
      },
    });
    this.touchJob(jobId);

    return this.success();
  }

  async deleteJobApplication(id: string): Promise<IpcSuccessResponse> {
    this.requireJob(id);
    this.repos.job.deleteByJobId(id);
    return this.success();
  }

  deleteAllJobApplications(): IpcSuccessResponse {
    this.db.delete(jobs).run();
    return this.success();
  }

  async saveResume(
    jobId: string,
    dto: SaveResumeInput,
  ): Promise<IpcSuccessResponse> {
    this.requireJob(jobId);
    this.repos.resume.updateByJobId(jobId, {
      tailoredResume: dto.resumeStructure,
      templateId: dto.templateId,
    });
    this.touchJob(jobId);
    return this.success();
  }

  async patchJobApplication(
    jobId: string,
    dto: PatchJobApplicationInput,
  ): Promise<IpcSuccessResponse> {
    const current = this.repos.job.getSummary(jobId);
    if (!current) {
      throw new JobNotFoundError(jobId);
    }

    const jobUpdate: Record<string, unknown> = { updatedAt: nowISO() };

    if (dto.companyName !== undefined) {
      jobUpdate.companyName = dto.companyName;
    }
    if (dto.position !== undefined) {
      jobUpdate.position = dto.position;
    }
    if (dto.dueDate !== undefined) {
      jobUpdate.dueDate = dto.dueDate;
    }
    if (dto.jobUrl !== undefined) {
      jobUpdate.jobUrl = dto.jobUrl;
    }
    if (dto.pinned !== undefined) {
      jobUpdate.pinned = dto.pinned ? 1 : 0;
      jobUpdate.pinnedAt = dto.pinned ? nowISO() : null;
    }
    if (dto.archived !== undefined) {
      jobUpdate.archived = dto.archived ? 1 : 0;
    }
    if (dto.applicationStatus !== undefined) {
      jobUpdate.applicationStatus = dto.applicationStatus;
      jobUpdate.statusUpdatedAt = dto.applicationStatus ? nowISO() : null;
    }

    this.repos.job.updateByJobId(jobId, jobUpdate);

    if (dto.jobDescription !== undefined) {
      this.repos.checklist.updateByJobId(jobId, {
        jobDescription: dto.jobDescription,
      });
    }

    return this.success();
  }

  private deduplicateKeywords(kw: string[]): string[] {
    const s = new Set<string>();
    return kw
      .map((k) => k.trim())
      .filter((k) => k && !s.has(k.toLowerCase()) && s.add(k.toLowerCase()));
  }
}
