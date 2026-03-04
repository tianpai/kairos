import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import {
  checklists,
  companies,
  jobs,
  resumes,
  scores,
  workflows,
} from "../db/schema";
import type * as schema from "../db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type {
  JobApplication,
  JobApplicationDetails,
  JobsCreateResult,
} from "@type/jobs-ipc";
import type { IpcSuccessResponse } from "@type/ipc";
import type { WorkflowStatus } from "@type/workflow";
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
type WorkflowState = Record<string, unknown>;

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

function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return (
    value === "idle" ||
    value === "running" ||
    value === "completed" ||
    value === "failed"
  );
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

    return this.db.insert(companies).values({ name }).returning().get();
  }

  private ensureJobExists(jobId: string): void {
    const existing = this.db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .get();
    if (!existing) throw new JobNotFoundError(jobId);
  }

  private getWorkflowDetails(state: WorkflowState | null): {
    workflowSteps: JobApplicationDetails["workflowSteps"];
    workflowStatus: JobApplicationDetails["workflowStatus"];
  } {
    const workflowSteps =
      (state as JobApplicationDetails["workflowSteps"] | null) ?? null;
    const status = workflowSteps?.status;
    return {
      workflowSteps,
      workflowStatus: isWorkflowStatus(status) ? status : null,
    };
  }

  private requireJobApplication(id: string) {
    const row = this.db
      .select({
        id: jobs.id,
        companyId: jobs.companyId,
        companyName: companies.name,
        position: jobs.position,
        dueDate: jobs.dueDate,
        status: jobs.status,
        applicationStatus: jobs.applicationStatus,
        jobUrl: jobs.jobUrl,
        archived: jobs.archived,
        pinned: jobs.pinned,
        pinnedAt: jobs.pinnedAt,
        statusUpdatedAt: jobs.statusUpdatedAt,
        interviewDate: jobs.interviewDate,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        templateId: resumes.templateId,
        originalResume: resumes.originalResume,
        parsedResume: resumes.parsedResume,
        tailoredResume: resumes.tailoredResume,
        jobDescription: checklists.jobDescription,
        checklist: checklists.checklist,
        matchPercentage: scores.matchPercentage,
        workflowState: workflows.state,
      })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(resumes, eq(resumes.jobId, jobs.id))
      .leftJoin(checklists, eq(checklists.jobId, jobs.id))
      .leftJoin(scores, eq(scores.jobId, jobs.id))
      .leftJoin(workflows, eq(workflows.jobId, jobs.id))
      .where(eq(jobs.id, id))
      .get();

    if (!row) throw new JobNotFoundError(id);

    return row;
  }

  async createJobApplication(
    dto: CreateJobApplicationInput,
  ): Promise<JobsCreateResult> {
    const jobId = randomUUID();
    const company = this.getOrCreateCompany(dto.companyName);
    const now = nowISO();

    this.db.transaction((tx) => {
      tx.insert(jobs)
        .values({
          id: jobId,
          companyId: company.id,
          position: dto.position,
          dueDate: dto.dueDate,
          jobUrl: dto.jobUrl ?? null,
          status: "active",
          applicationStatus: null,
          archived: 0,
          pinned: 0,
          pinnedAt: null,
          statusUpdatedAt: null,
          interviewDate: null,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      tx.insert(resumes)
        .values({
          jobId,
          templateId: dto.templateId,
          originalResume: dto.rawResumeContent,
          parsedResume: null,
          tailoredResume: null,
        })
        .run();

      tx.insert(checklists)
        .values({
          jobId,
          jobDescription: dto.jobDescription,
          checklist: null,
        })
        .run();

      tx.insert(scores).values({ jobId, matchPercentage: 0 }).run();
      tx.insert(workflows).values({ jobId, state: null }).run();
    });

    return { id: jobId };
  }

  async createFromExisting(
    dto: CreateFromExistingInput,
  ): Promise<JobsCreateResult> {
    const sourceJob = this.requireJobApplication(dto.sourceJobId);
    const jobId = randomUUID();
    const company = this.getOrCreateCompany(dto.companyName);
    const now = nowISO();

    this.db.transaction((tx) => {
      tx.insert(jobs)
        .values({
          id: jobId,
          companyId: company.id,
          position: dto.position,
          dueDate: dto.dueDate,
          jobUrl: dto.jobUrl ?? null,
          status: "active",
          applicationStatus: null,
          archived: 0,
          pinned: 0,
          pinnedAt: null,
          statusUpdatedAt: null,
          interviewDate: null,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      tx.insert(resumes)
        .values({
          jobId,
          templateId: dto.templateId,
          originalResume: sourceJob.originalResume ?? "",
          parsedResume: sourceJob.parsedResume,
          tailoredResume: sourceJob.parsedResume,
        })
        .run();

      tx.insert(checklists)
        .values({
          jobId,
          jobDescription: dto.jobDescription,
          checklist: null,
        })
        .run();

      tx.insert(scores).values({ jobId, matchPercentage: 0 }).run();
      tx.insert(workflows).values({ jobId, state: null }).run();
    });

    return { id: jobId };
  }

  async listJobApplications(
    query: ListJobsInput = {},
  ): Promise<JobApplication[]> {
    const archived = query.archived ?? false;
    const rows = this.db
      .select({
        id: jobs.id,
        companyName: companies.name,
        position: jobs.position,
        dueDate: jobs.dueDate,
        matchPercentage: scores.matchPercentage,
        applicationStatus: jobs.applicationStatus,
        jobUrl: jobs.jobUrl,
        originalResume: resumes.originalResume,
        pinned: jobs.pinned,
        pinnedAt: jobs.pinnedAt,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(resumes, eq(resumes.jobId, jobs.id))
      .leftJoin(scores, eq(scores.jobId, jobs.id))
      .where(eq(jobs.archived, archived ? 1 : 0))
      .orderBy(desc(jobs.createdAt))
      .all();

    return rows.map((row) => ({
      id: row.id,
      companyName: row.companyName,
      position: row.position,
      dueDate: toDateOnly(row.dueDate),
      matchPercentage: row.matchPercentage ?? 0,
      applicationStatus: row.applicationStatus,
      jobUrl: row.jobUrl,
      originalResume: row.originalResume ?? "",
      pinned: row.pinned,
      pinnedAt: row.pinnedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async getJobApplication(id: string): Promise<JobApplicationDetails> {
    const job = this.requireJobApplication(id);
    const { workflowSteps, workflowStatus } = this.getWorkflowDetails(
      job.workflowState as WorkflowState | null,
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
      parsedResume:
        (job.parsedResume as JobApplicationDetails["parsedResume"]) ?? null,
      tailoredResume:
        (job.tailoredResume as JobApplicationDetails["tailoredResume"]) ?? null,
      checklist: (job.checklist as JobApplicationDetails["checklist"]) ?? null,
      workflowStatus,
      workflowSteps,
      failedTasks,
    };
  }

  async deleteJobApplication(id: string): Promise<IpcSuccessResponse> {
    this.ensureJobExists(id);
    this.db.delete(jobs).where(eq(jobs.id, id)).run();
    return { success: true };
  }

  deleteAllJobApplications(): IpcSuccessResponse {
    this.db.transaction((tx) => {
      tx.delete(jobs).run();
      tx.delete(companies).run();
    });
    return { success: true };
  }

  async saveResume(
    jobId: string,
    dto: SaveResumeInput,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);

    this.db.transaction((tx) => {
      tx.update(resumes)
        .set({
          tailoredResume: dto.resumeStructure,
          templateId: dto.templateId,
        })
        .where(eq(resumes.jobId, jobId))
        .run();

      tx.update(jobs).set({ updatedAt: nowISO() }).where(eq(jobs.id, jobId)).run();
    });

    return { success: true };
  }

  async saveParsedResume(
    jobId: string,
    dto: SaveParsedResumeInput,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);

    this.db.transaction((tx) => {
      tx.update(resumes)
        .set({
          parsedResume: dto.parsedResume,
          tailoredResume: dto.tailoredResume,
        })
        .where(eq(resumes.jobId, jobId))
        .run();

      tx.update(jobs).set({ updatedAt: nowISO() }).where(eq(jobs.id, jobId)).run();
    });

    return { success: true };
  }

  async saveTailoredResume(
    jobId: string,
    dto: SaveTailoredResumeInput,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);

    this.db.transaction((tx) => {
      tx.update(resumes)
        .set({ tailoredResume: dto.tailoredResume })
        .where(eq(resumes.jobId, jobId))
        .run();

      tx.update(jobs).set({ updatedAt: nowISO() }).where(eq(jobs.id, jobId)).run();
    });

    return { success: true };
  }

  async saveChecklist(
    jobId: string,
    dto: SaveChecklistInput,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);

    this.db.transaction((tx) => {
      tx.update(checklists)
        .set({ checklist: dto.checklist })
        .where(eq(checklists.jobId, jobId))
        .run();

      tx.update(jobs).set({ updatedAt: nowISO() }).where(eq(jobs.id, jobId)).run();
    });

    return { success: true };
  }

  async saveMatchScore(
    jobId: string,
    matchPercentage: number,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);

    this.db.transaction((tx) => {
      tx.update(scores)
        .set({ matchPercentage })
        .where(eq(scores.jobId, jobId))
        .run();

      tx.update(jobs).set({ updatedAt: nowISO() }).where(eq(jobs.id, jobId)).run();
    });

    return { success: true };
  }

  async saveWorkflowState(
    jobId: string,
    dto: SaveWorkflowStateInput,
  ): Promise<IpcSuccessResponse> {
    this.ensureJobExists(jobId);

    const existing = this.db
      .select({ state: workflows.state })
      .from(workflows)
      .where(eq(workflows.jobId, jobId))
      .get();

    let nextState: WorkflowState | null | undefined =
      (dto.workflowSteps as WorkflowState | undefined) ?? undefined;

    if (dto.workflowStatus !== undefined) {
      const baseState =
        nextState ?? (existing?.state as WorkflowState | null) ?? {};
      nextState = { ...baseState, status: dto.workflowStatus };
    }

    this.db.transaction((tx) => {
      if (existing) {
        if (nextState !== undefined) {
          tx.update(workflows)
            .set({ state: nextState })
            .where(eq(workflows.jobId, jobId))
            .run();
        }
      } else {
        tx.insert(workflows)
          .values({ jobId, state: nextState ?? null })
          .run();
      }

      tx.update(jobs).set({ updatedAt: nowISO() }).where(eq(jobs.id, jobId)).run();
    });

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
      pinned: number;
      pinnedAt: string | null;
      archived: number;
      applicationStatus: string | null;
      statusUpdatedAt: string | null;
      updatedAt: string;
    }> = {
      updatedAt: nowISO(),
    };

    if (
      dto.companyName !== undefined &&
      dto.companyName !== current.companyName
    ) {
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

    this.db.transaction((tx) => {
      tx.update(jobs).set(updateData).where(eq(jobs.id, jobId)).run();

      if (dto.jobDescription !== undefined) {
        tx.update(checklists)
          .set({ jobDescription: dto.jobDescription })
          .where(eq(checklists.jobId, jobId))
          .run();
      }
    });

    return { success: true };
  }
}
