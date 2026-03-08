import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { ChecklistSchema } from "@type/checklist";
import {
  checklists,
  jobs,
  resumes,
  scores,
  workflows,
} from "../../persistence";
import type { Checklist } from "@type/checklist";
import type { PersistenceSchema } from "../../persistence";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type {
  CreateFromExistingInput,
  CreateJobApplicationInput,
  JobSummary,
  JobsCreateResult,
  SaveChecklistInput,
  SaveParsedResumeInput,
  SaveTailoredResumeInput,
  SaveWorkflowStateInput,
} from "@type/jobs-ipc";

type Database = BetterSQLite3Database<PersistenceSchema>;
type Transaction = Parameters<Database["transaction"]>[0] extends (
  tx: infer T,
  ...args: never[]
) => unknown
  ? T
  : never;
type WorkflowState = Record<string, unknown>;

function nowISO(): string {
  return new Date().toISOString();
}

function toDateOnly(value: string): string {
  return value.split("T")[0];
}

export interface WorkflowRecord {
  workflowState: WorkflowState | null;
}

export interface ResumeData {
  templateId: string;
  jobDescription: string | null;
  originalResume: string;
  parsedResume: Record<string, unknown> | null;
  tailoredResume: Record<string, unknown> | null;
}

export interface WorkflowPersistencePort {
  getWorkflowRecord: (jobId: string) => WorkflowRecord | undefined;
  saveWorkflowState: (jobId: string, dto: SaveWorkflowStateInput) => void;
  getResume: (jobId: string) => ResumeData;
  getChecklist: (jobId: string) => Checklist | null;
  getJobSummary: (jobId: string) => JobSummary;
  createJobApplication: (dto: CreateJobApplicationInput) => JobsCreateResult;
  createFromExisting: (dto: CreateFromExistingInput) => JobsCreateResult;
  saveParsedResume: (jobId: string, dto: SaveParsedResumeInput) => void;
  saveTailoredResume: (jobId: string, dto: SaveTailoredResumeInput) => void;
  saveChecklist: (jobId: string, dto: SaveChecklistInput) => void;
  saveMatchScore: (jobId: string, matchPercentage: number) => void;
  patchJob: (
    jobId: string,
    updates: {
      companyName?: string;
      position?: string;
      dueDate?: string;
      jobUrl?: string | null;
    },
  ) => void;
}

class JobNotFoundError extends Error {
  constructor(id: string) {
    super(`Job application with ID ${id} not found`);
    this.name = "JobNotFoundError";
  }
}

export class WorkflowPersistence implements WorkflowPersistencePort {
  constructor(private readonly db: Database) {}

  getWorkflowRecord(jobId: string): WorkflowRecord | undefined {
    const row = this.db
      .select({
        id: jobs.id,
        workflowState: workflows.state,
      })
      .from(jobs)
      .leftJoin(workflows, eq(workflows.jobId, jobs.id))
      .where(eq(jobs.id, jobId))
      .get();

    if (!row) {
      return undefined;
    }

    return {
      workflowState: (row.workflowState as WorkflowState | null) ?? null,
    };
  }

  saveWorkflowState(jobId: string, dto: SaveWorkflowStateInput): void {
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

      this.touchJob(tx, jobId);
    });
  }

  // TODO: replace it with direct repo.ts resume methods
  getResume(jobId: string): ResumeData {
    const row = this.db
      .select({
        id: jobs.id,
        templateId: resumes.templateId,
        originalResume: resumes.originalResume,
        parsedResume: resumes.parsedResume,
        tailoredResume: resumes.tailoredResume,
        jobDescription: checklists.jobDescription,
      })
      .from(jobs)
      .leftJoin(resumes, eq(resumes.jobId, jobs.id))
      .leftJoin(checklists, eq(checklists.jobId, jobs.id))
      .where(eq(jobs.id, jobId))
      .get();

    if (!row) {
      throw new JobNotFoundError(jobId);
    }

    return {
      templateId: row.templateId ?? "",
      jobDescription: row.jobDescription ?? null,
      originalResume: row.originalResume ?? "",
      parsedResume: row.parsedResume ?? null,
      tailoredResume: row.tailoredResume ?? null,
    };
  }

  // TODO: replace it with direct repo.ts resume methods
  getChecklist(jobId: string): Checklist | null {
    const row = this.db
      .select({
        id: jobs.id,
        checklist: checklists.checklist,
      })
      .from(jobs)
      .leftJoin(checklists, eq(checklists.jobId, jobs.id))
      .where(eq(jobs.id, jobId))
      .get();

    if (!row) {
      throw new JobNotFoundError(jobId);
    }

    if (!row.checklist) {
      return null;
    }

    const parsed = ChecklistSchema.safeParse(row.checklist);
    return parsed.success ? parsed.data : null;
  }

  // TODO: replace it with direct repo.ts job findById methods
  getJobSummary(jobId: string): JobSummary {
    const row = this.db
      .select({
        id: jobs.id,
        companyName: jobs.companyName,
        position: jobs.position,
        dueDate: jobs.dueDate,
        matchPercentage: scores.matchPercentage,
        applicationStatus: jobs.applicationStatus,
        jobUrl: jobs.jobUrl,
        pinned: jobs.pinned,
        pinnedAt: jobs.pinnedAt,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .leftJoin(scores, eq(scores.jobId, jobs.id))
      .where(eq(jobs.id, jobId))
      .get();

    if (!row) {
      throw new JobNotFoundError(jobId);
    }

    return {
      id: row.id,
      companyName: row.companyName,
      position: row.position,
      dueDate: toDateOnly(row.dueDate),
      matchPercentage: row.matchPercentage ?? 0,
      applicationStatus: row.applicationStatus,
      jobUrl: row.jobUrl,
      pinned: row.pinned,
      pinnedAt: row.pinnedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  createJobApplication(dto: CreateJobApplicationInput): JobsCreateResult {
    const jobId = randomUUID();
    const now = nowISO();

    this.db.transaction((tx) => {
      tx.insert(jobs)
        .values({
          id: jobId,
          companyName: dto.companyName,
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

  createFromExisting(dto: CreateFromExistingInput): JobsCreateResult {
    const sourceResume = this.db
      .select({
        templateId: resumes.templateId,
        originalResume: resumes.originalResume,
        parsedResume: resumes.parsedResume,
      })
      .from(resumes)
      .where(eq(resumes.jobId, dto.sourceJobId))
      .get();

    if (!sourceResume) {
      throw new JobNotFoundError(dto.sourceJobId);
    }

    const jobId = randomUUID();
    const now = nowISO();

    this.db.transaction((tx) => {
      tx.insert(jobs)
        .values({
          id: jobId,
          companyName: dto.companyName,
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
          originalResume: sourceResume.originalResume ?? "",
          parsedResume: sourceResume.parsedResume,
          tailoredResume: sourceResume.parsedResume,
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

  // TODO: use repo.ts resme updateByid
  saveParsedResume(jobId: string, dto: SaveParsedResumeInput): void {
    this.runJobMutation(jobId, (tx) => {
      tx.update(resumes)
        .set({
          parsedResume: dto.parsedResume,
          tailoredResume: dto.tailoredResume,
        })
        .where(eq(resumes.jobId, jobId))
        .run();
    });
  }

  // TODO: use repo.ts resme updateByid
  saveTailoredResume(jobId: string, dto: SaveTailoredResumeInput): void {
    this.runJobMutation(jobId, (tx) => {
      tx.update(resumes)
        .set({ tailoredResume: dto.tailoredResume })
        .where(eq(resumes.jobId, jobId))
        .run();
    });
  }

  // TODO: use repo.ts resme updateByid
  saveChecklist(jobId: string, dto: SaveChecklistInput): void {
    this.runJobMutation(jobId, (tx) => {
      tx.update(checklists)
        .set({ checklist: dto.checklist })
        .where(eq(checklists.jobId, jobId))
        .run();
    });
  }

  // TODO: use repo.ts resme updateByid
  saveMatchScore(jobId: string, matchPercentage: number): void {
    this.runJobMutation(jobId, (tx) => {
      tx.update(scores)
        .set({ matchPercentage })
        .where(eq(scores.jobId, jobId))
        .run();
    });
  }

  patchJob(
    jobId: string,
    updates: {
      companyName?: string;
      position?: string;
      dueDate?: string;
      jobUrl?: string | null;
    },
  ): void {
    const jobUpdate: Record<string, unknown> = { updatedAt: nowISO() };

    if (updates.companyName !== undefined) {
      jobUpdate.companyName = updates.companyName;
    }
    if (updates.position !== undefined) {
      jobUpdate.position = updates.position;
    }
    if (updates.dueDate !== undefined) {
      jobUpdate.dueDate = updates.dueDate;
    }
    if (updates.jobUrl !== undefined) {
      jobUpdate.jobUrl = updates.jobUrl;
    }

    this.db.update(jobs).set(jobUpdate).where(eq(jobs.id, jobId)).run();
  }

  private runJobMutation(
    jobId: string,
    mutate: (tx: Transaction) => void,
  ): void {
    this.db.transaction((tx) => {
      mutate(tx);
      this.touchJob(tx, jobId);
    });
  }

  private touchJob(tx: Transaction, jobId: string): void {
    tx.update(jobs)
      .set({ updatedAt: nowISO() })
      .where(eq(jobs.id, jobId))
      .run();
  }
}
