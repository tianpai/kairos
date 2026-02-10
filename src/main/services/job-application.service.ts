import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { companies, jobApplications } from "../db/schema";
import type * as schema from "../db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type {
  CreateFromExistingInput,
  CreateJobApplicationInput,
  SaveChecklistInput,
  SaveParsedResumeInput,
  SaveResumeInput,
  SaveTailoredResumeInput,
  SaveWorkflowStateInput,
  UpdateJobApplicationInput,
  UpdateJobDescriptionInput,
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

  async createJobApplication(
    dto: CreateJobApplicationInput,
  ): Promise<{ id: string }> {
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
  ): Promise<{ id: string }> {
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

  async getAllJobApplications(): Promise<
    Array<{
      id: string;
      companyName: string;
      position: string;
      dueDate: string;
      matchPercentage: number;
      applicationStatus: string | null;
      jobUrl: string | null;
      originalResume: string;
      pinned: number;
      pinnedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  > {
    const results = this.db
      .select()
      .from(jobApplications)
      .innerJoin(companies, eq(jobApplications.companyId, companies.id))
      .orderBy(desc(jobApplications.createdAt))
      .all();

    return results.map((row) => ({
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
    }));
  }

  async getJobApplication(id: string): Promise<{
    id: string;
    companyName: string;
    position: string;
    dueDate: string;
    matchPercentage: number;
    applicationStatus: string | null;
    jobUrl: string | null;
    createdAt: string;
    updatedAt: string;
    templateId: string;
    jobDescription: string | null;
    parsedResume: Record<string, unknown> | null;
    tailoredResume: Record<string, unknown> | null;
    originalResume: string;
    checklist: Record<string, unknown> | null;
    workflowStatus: string | null;
    workflowSteps: Record<string, unknown> | null;
    failedTasks: Record<string, unknown>;
  }> {
    const job = this.requireJobApplication(id);

    const workflowSteps = job.workflowSteps;
    const failedTasks: Record<string, unknown> = {};

    if (
      workflowSteps &&
      typeof workflowSteps === "object" &&
      "taskStates" in workflowSteps
    ) {
      const taskStates = workflowSteps.taskStates as Record<string, unknown>;
      Object.entries(taskStates).forEach(([task, status]) => {
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
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      templateId: job.templateId,
      jobDescription: job.jobDescription,
      parsedResume: job.parsedResume,
      tailoredResume: job.tailoredResume,
      originalResume: job.originalResume,
      checklist: job.checklist,
      workflowStatus: job.workflowStatus,
      workflowSteps: workflowSteps,
      failedTasks,
    };
  }

  async deleteJobApplication(id: string): Promise<{ success: boolean }> {
    this.requireJobApplication(id);
    this.db.delete(jobApplications).where(eq(jobApplications.id, id)).run();
    return { success: true };
  }

  deleteAllJobApplications(): { success: boolean } {
    // Delete in order: jobApplications first (has FK to companies), then companies
    this.db.transaction((tx) => {
      tx.delete(jobApplications).run();
      tx.delete(companies).run();
    });
    return { success: true };
  }

  async updateJobApplication(
    id: string,
    dto: UpdateJobApplicationInput,
  ): Promise<{
    id: string;
    companyName: string;
    position: string;
    dueDate: string;
    matchPercentage: number;
  }> {
    const job = this.requireJobApplication(id);
    let companyId = job.companyId;
    let companyName = job.company.name;

    if (dto.companyName && dto.companyName !== job.company.name) {
      const company = this.getOrCreateCompany(dto.companyName);
      companyId = company.id;
      companyName = company.name;
    }

    const updateData: Partial<{
      companyId: number;
      position: string;
      dueDate: string;
      jobUrl: string | null;
      updatedAt: string;
    }> = {
      updatedAt: nowISO(),
    };

    if (dto.companyName) {
      updateData.companyId = companyId;
    }
    if (dto.position) {
      updateData.position = dto.position;
    }
    if (dto.dueDate) {
      updateData.dueDate = dto.dueDate;
    }
    if (dto.jobUrl !== undefined) {
      updateData.jobUrl = dto.jobUrl;
    }

    this.db
      .update(jobApplications)
      .set(updateData)
      .where(eq(jobApplications.id, id))
      .run();

    const updated = this.db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, id))
      .get()!;

    return {
      id: updated.id,
      companyName,
      position: updated.position,
      dueDate: updated.dueDate.split("T")[0],
      matchPercentage: updated.matchPercentage,
    };
  }

  async saveResume(
    jobId: string,
    dto: SaveResumeInput,
  ): Promise<{ success: boolean }> {
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
  ): Promise<{ success: boolean }> {
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
  ): Promise<{ success: boolean }> {
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
  ): Promise<{ success: boolean }> {
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
  ): Promise<{ success: boolean }> {
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
  ): Promise<{ success: boolean }> {
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

  async updateJobDescription(
    jobId: string,
    dto: UpdateJobDescriptionInput,
  ): Promise<{ success: boolean }> {
    this.db
      .update(jobApplications)
      .set({
        jobDescription: dto.jobDescription,
        updatedAt: nowISO(),
      })
      .where(eq(jobApplications.id, jobId))
      .run();
    return { success: true };
  }

  async togglePin(
    jobId: string,
    pinned: boolean,
  ): Promise<{ success: boolean }> {
    this.requireJobApplication(jobId);

    this.db
      .update(jobApplications)
      .set({
        pinned: pinned ? 1 : 0,
        pinnedAt: pinned ? nowISO() : null,
        updatedAt: nowISO(),
      })
      .where(eq(jobApplications.id, jobId))
      .run();
    return { success: true };
  }
}
