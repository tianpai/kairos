import { desc, eq } from "drizzle-orm";
import {
  checklists,
  companies,
  jobs,
  resumes,
  scores,
  workflows,
} from "../persistence";
import type { PersistenceSchema } from "../persistence";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { JobApplication } from "@type/jobs-ipc";
import type {
  SaveChecklistInput,
  SaveParsedResumeInput,
  SaveResumeInput,
  SaveTailoredResumeInput,
  SaveWorkflowStateInput,
} from "../../schemas/job-application.schemas";
import type { WorkflowState } from "./application/application-read.model";

type Database = BetterSQLite3Database<PersistenceSchema>;
type Transaction = Parameters<Database["transaction"]>[0] extends (
  tx: infer T,
  ...args: never[]
) => unknown
  ? T
  : never;

export interface WorkspaceApplicationRecord {
  id: string;
  companyId: number;
  companyName: string;
  position: string;
  dueDate: string;
  status: string;
  applicationStatus: string | null;
  jobUrl: string | null;
  archived: number;
  pinned: number;
  pinnedAt: string | null;
  statusUpdatedAt: string | null;
  interviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  templateId: string | null;
  originalResume: string | null;
  parsedResume: Record<string, unknown> | null;
  tailoredResume: Record<string, unknown> | null;
  jobDescription: string | null;
  checklist: Record<string, unknown> | null;
  matchPercentage: number | null;
  workflowState: WorkflowState | null;
}

export interface WorkspaceInsertApplicationInput {
  id: string;
  companyName: string;
  position: string;
  dueDate: string;
  jobUrl: string | null;
  templateId: string;
  originalResume: string;
  parsedResume: Record<string, unknown> | null;
  tailoredResume: Record<string, unknown> | null;
  jobDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceJobUpdate {
  companyId?: number;
  position?: string;
  dueDate?: string;
  jobUrl?: string | null;
  pinned?: number;
  pinnedAt?: string | null;
  archived?: number;
  applicationStatus?: string | null;
  statusUpdatedAt?: string | null;
  updatedAt: string;
}

export interface WorkspacePersistencePort {
  hasJob: (id: string) => boolean;
  getApplicationRecord: (id: string) => WorkspaceApplicationRecord | undefined;
  listApplications: (archived: boolean) => JobApplication[];
  insertApplication: (input: WorkspaceInsertApplicationInput) => void;
  deleteApplication: (id: string) => void;
  deleteAllApplications: () => void;
  saveResume: (jobId: string, dto: SaveResumeInput) => void;
  saveParsedResume: (jobId: string, dto: SaveParsedResumeInput) => void;
  saveTailoredResume: (jobId: string, dto: SaveTailoredResumeInput) => void;
  saveChecklist: (jobId: string, dto: SaveChecklistInput) => void;
  saveMatchScore: (jobId: string, matchPercentage: number) => void;
  saveWorkflowState: (jobId: string, dto: SaveWorkflowStateInput) => void;
  getOrCreateCompanyId: (name: string) => number;
  updateApplication: (
    jobId: string,
    update: WorkspaceJobUpdate,
    jobDescription?: string,
  ) => void;
}

function nowISO(): string {
  return new Date().toISOString();
}

function toDateOnly(value: string): string {
  return value.split("T")[0];
}

export class WorkspacePersistence implements WorkspacePersistencePort {
  constructor(private readonly db: Database) {}

  hasJob(id: string): boolean {
    const existing = this.db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, id))
      .get();

    return Boolean(existing);
  }

  getApplicationRecord(id: string): WorkspaceApplicationRecord | undefined {
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

    return row as WorkspaceApplicationRecord | undefined;
  }

  listApplications(archived: boolean): JobApplication[] {
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

  insertApplication(input: WorkspaceInsertApplicationInput): void {
    const companyId = this.getOrCreateCompanyId(input.companyName);

    this.db.transaction((tx) => {
      tx.insert(jobs)
        .values({
          id: input.id,
          companyId,
          position: input.position,
          dueDate: input.dueDate,
          jobUrl: input.jobUrl,
          status: "active",
          applicationStatus: null,
          archived: 0,
          pinned: 0,
          pinnedAt: null,
          statusUpdatedAt: null,
          interviewDate: null,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
        })
        .run();

      tx.insert(resumes)
        .values({
          jobId: input.id,
          templateId: input.templateId,
          originalResume: input.originalResume,
          parsedResume: input.parsedResume,
          tailoredResume: input.tailoredResume,
        })
        .run();

      tx.insert(checklists)
        .values({
          jobId: input.id,
          jobDescription: input.jobDescription,
          checklist: null,
        })
        .run();

      tx.insert(scores).values({ jobId: input.id, matchPercentage: 0 }).run();
      tx.insert(workflows).values({ jobId: input.id, state: null }).run();
    });
  }

  deleteApplication(id: string): void {
    this.db.delete(jobs).where(eq(jobs.id, id)).run();
  }

  deleteAllApplications(): void {
    this.db.transaction((tx) => {
      tx.delete(jobs).run();
      tx.delete(companies).run();
    });
  }

  saveResume(jobId: string, dto: SaveResumeInput): void {
    this.runJobMutation(jobId, (tx) => {
      tx.update(resumes)
        .set({
          tailoredResume: dto.resumeStructure,
          templateId: dto.templateId,
        })
        .where(eq(resumes.jobId, jobId))
        .run();
    });
  }

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

  saveTailoredResume(jobId: string, dto: SaveTailoredResumeInput): void {
    this.runJobMutation(jobId, (tx) => {
      tx.update(resumes)
        .set({ tailoredResume: dto.tailoredResume })
        .where(eq(resumes.jobId, jobId))
        .run();
    });
  }

  saveChecklist(jobId: string, dto: SaveChecklistInput): void {
    this.runJobMutation(jobId, (tx) => {
      tx.update(checklists)
        .set({ checklist: dto.checklist })
        .where(eq(checklists.jobId, jobId))
        .run();
    });
  }

  saveMatchScore(jobId: string, matchPercentage: number): void {
    this.runJobMutation(jobId, (tx) => {
      tx.update(scores)
        .set({ matchPercentage })
        .where(eq(scores.jobId, jobId))
        .run();
    });
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

    this.runJobMutation(jobId, (tx) => {
      if (existing) {
        if (nextState !== undefined) {
          tx.update(workflows)
            .set({ state: nextState })
            .where(eq(workflows.jobId, jobId))
            .run();
        }
        return;
      }

      tx.insert(workflows)
        .values({ jobId, state: nextState ?? null })
        .run();
    });
  }

  getOrCreateCompanyId(name: string): number {
    const existing = this.db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.name, name))
      .get();

    if (existing) {
      return existing.id;
    }

    return this.db.insert(companies).values({ name }).returning().get().id;
  }

  updateApplication(
    jobId: string,
    update: WorkspaceJobUpdate,
    jobDescription?: string,
  ): void {
    this.db.transaction((tx) => {
      tx.update(jobs).set(update).where(eq(jobs.id, jobId)).run();

      if (jobDescription !== undefined) {
        tx.update(checklists)
          .set({ jobDescription })
          .where(eq(checklists.jobId, jobId))
          .run();
      }
    });
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
