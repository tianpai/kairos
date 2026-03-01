import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { companies, jobApplications } from "../db/schema";
import type * as schema from "../db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
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
} from "../schemas/job-application.schemas";

type Database = BetterSQLite3Database<typeof schema>;

export class JobNotFoundError extends Error {
  constructor(id: string) {
    super(`Job application with ID ${id} not found`);
    this.name = "JobNotFoundError";
  }
}

function nowISO(): string {
  return new Date().toISOString();
}

export class JobApplicationService {
  constructor(private readonly db: Database) {}

  private getOrCreateCompany(name: string): { id: number; name: string } {
    const existing = this.db
      .select()
      .from(companies)
      .where(eq(companies.name, name))
      .get();

    if (existing) return existing;

    const result = this.db.insert(companies).values({ name }).returning().get();

    return result;
  }

  private requireJobApplication(id: string) {
    const result = this.db
      .select()
      .from(jobApplications)
      .innerJoin(companies, eq(jobApplications.companyId, companies.id))
      .where(eq(jobApplications.id, id))
      .get();

    if (!result) throw new JobNotFoundError(id);

    return {
      ...result.job_applications,
      company: result.companies,
    };
  }

  private toListItem(row: {
    job_applications: typeof jobApplications.$inferSelect;
    companies: typeof companies.$inferSelect;
  }): JobApplication {
    return {
      id: row.job_applications.id,
      companyName: row.companies.name,
      position: row.job_applications.position,
      dueDate: row.job_applications.dueDate.split("T")[0],
      matchPercentage: row.job_applications.matchPercentage,
      applicationStatus: row.job_applications.applicationStatus,
      jobUrl: row.job_applications.jobUrl,
      originalResume: row.job_applications.originalResume,
      pinned: row.job_applications.pinned,
      pinnedAt: row.job_applications.pinnedAt,
      createdAt: row.job_applications.createdAt,
      updatedAt: row.job_applications.updatedAt,
    };
  }

  async createJobApplication(
    dto: CreateJobApplicationInput,
  ): Promise<JobsCreateResult> {
    const jobId = randomUUID();
    const company = this.getOrCreateCompany(dto.companyName);
    const now = nowISO();

    this.db
      .insert(jobApplications)
      .values({
        id: jobId,
        companyId: company.id,
        position: dto.position,
        dueDate: dto.dueDate,
        matchPercentage: 0,
        templateId: dto.templateId,
        jobDescription: dto.jobDescription,
        jobUrl: dto.jobUrl ?? null,
        originalResume: dto.rawResumeContent,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return { id: jobId };
  }

  async createFromExisting(
    dto: CreateFromExistingInput,
  ): Promise<JobsCreateResult> {
    const sourceJob = this.requireJobApplication(dto.sourceJobId);
    const jobId = randomUUID();
    const company = this.getOrCreateCompany(dto.companyName);
    const now = nowISO();

    this.db
      .insert(jobApplications)
      .values({
        id: jobId,
        companyId: company.id,
        position: dto.position,
        dueDate: dto.dueDate,
        matchPercentage: 0,
        templateId: dto.templateId,
        jobDescription: dto.jobDescription,
        jobUrl: dto.jobUrl ?? null,
        originalResume: sourceJob.originalResume,
        parsedResume: sourceJob.parsedResume,
        tailoredResume: sourceJob.parsedResume,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return { id: jobId };
  }

  async listJobApplications(
    query: ListJobsInput = {},
  ): Promise<Array<JobApplication>> {
    const archived = query.archived ?? false;
    const results = this.db
      .select()
      .from(jobApplications)
      .innerJoin(companies, eq(jobApplications.companyId, companies.id))
      .where(eq(jobApplications.archived, archived ? 1 : 0))
      .orderBy(desc(jobApplications.createdAt))
      .all();

    return results.map((row) => this.toListItem(row));
  }

  async getJobApplication(id: string): Promise<JobApplicationDetails> {
    const job = this.requireJobApplication(id);

    const workflowSteps = job.workflowSteps as JobApplicationDetails["workflowSteps"];
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
      companyName: job.company.name,
      position: job.position,
      dueDate: job.dueDate.split("T")[0],
      matchPercentage: job.matchPercentage,
      applicationStatus: job.applicationStatus,
      jobUrl: job.jobUrl,
      pinned: job.pinned,
      pinnedAt: job.pinnedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      templateId: job.templateId,
      jobDescription: job.jobDescription,
      parsedResume: job.parsedResume,
      tailoredResume: job.tailoredResume,
      originalResume: job.originalResume,
      checklist: job.checklist as JobApplicationDetails["checklist"],
      workflowStatus: job.workflowStatus as JobApplicationDetails["workflowStatus"],
      workflowSteps: workflowSteps,
      failedTasks,
    };
  }

  async deleteJobApplication(id: string): Promise<IpcSuccessResponse> {
    this.requireJobApplication(id);
    this.db.delete(jobApplications).where(eq(jobApplications.id, id)).run();
    return { success: true };
  }

  deleteAllJobApplications(): IpcSuccessResponse {
    // Delete in order: jobApplications first (has FK to companies), then companies
    this.db.transaction((tx) => {
      tx.delete(jobApplications).run();
      tx.delete(companies).run();
    });
    return { success: true };
  }

  async saveResume(
    jobId: string,
    dto: SaveResumeInput,
  ): Promise<IpcSuccessResponse> {
    this.db
      .update(jobApplications)
      .set({
        tailoredResume: dto.resumeStructure,
        templateId: dto.templateId,
        updatedAt: nowISO(),
      })
      .where(eq(jobApplications.id, jobId))
      .run();
    return { success: true };
  }

  async saveParsedResume(
    jobId: string,
    dto: SaveParsedResumeInput,
  ): Promise<IpcSuccessResponse> {
    this.db
      .update(jobApplications)
      .set({
        parsedResume: dto.parsedResume,
        tailoredResume: dto.tailoredResume,
        updatedAt: nowISO(),
      })
      .where(eq(jobApplications.id, jobId))
      .run();
    return { success: true };
  }

  async saveTailoredResume(
    jobId: string,
    dto: SaveTailoredResumeInput,
  ): Promise<IpcSuccessResponse> {
    this.db
      .update(jobApplications)
      .set({
        tailoredResume: dto.tailoredResume,
        updatedAt: nowISO(),
      })
      .where(eq(jobApplications.id, jobId))
      .run();
    return { success: true };
  }

  async saveChecklist(
    jobId: string,
    dto: SaveChecklistInput,
  ): Promise<IpcSuccessResponse> {
    this.db
      .update(jobApplications)
      .set({
        checklist: dto.checklist,
        updatedAt: nowISO(),
      })
      .where(eq(jobApplications.id, jobId))
      .run();
    return { success: true };
  }

  async saveMatchScore(
    jobId: string,
    matchPercentage: number,
  ): Promise<IpcSuccessResponse> {
    this.db
      .update(jobApplications)
      .set({
        matchPercentage,
        updatedAt: nowISO(),
      })
      .where(eq(jobApplications.id, jobId))
      .run();
    return { success: true };
  }

  async saveWorkflowState(
    jobId: string,
    dto: SaveWorkflowStateInput,
  ): Promise<IpcSuccessResponse> {
    const updateData: Partial<{
      workflowSteps: Record<string, unknown> | null;
      workflowStatus: string | null;
      updatedAt: string;
    }> = {
      updatedAt: nowISO(),
    };

    if (dto.workflowSteps !== undefined) {
      updateData.workflowSteps = dto.workflowSteps;
    }
    if (dto.workflowStatus !== undefined) {
      updateData.workflowStatus = dto.workflowStatus;
    }

    this.db
      .update(jobApplications)
      .set(updateData)
      .where(eq(jobApplications.id, jobId))
      .run();
    return { success: true };
  }

  async patchJobApplication(
    jobId: string,
    dto: PatchJobApplicationInput,
  ): Promise<IpcSuccessResponse> {
    const current = this.requireJobApplication(jobId);
    const updateData: Partial<{
      companyId: number;
      position: string;
      dueDate: string;
      jobUrl: string | null;
      jobDescription: string | null;
      pinned: number;
      pinnedAt: string | null;
      archived: number;
      applicationStatus: string | null;
      statusUpdatedAt: string | null;
      updatedAt: string;
    }> = {
      updatedAt: nowISO(),
    };

    if (dto.companyName !== undefined && dto.companyName !== current.company.name) {
      const company = this.getOrCreateCompany(dto.companyName);
      updateData.companyId = company.id;
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
    if (dto.jobDescription !== undefined) {
      updateData.jobDescription = dto.jobDescription;
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

    this.db
      .update(jobApplications)
      .set(updateData)
      .where(eq(jobApplications.id, jobId))
      .run();

    return { success: true };
  }
}
