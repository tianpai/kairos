import { desc, eq } from "drizzle-orm";
import { checklists, jobs, resumes, scores, workflows } from "./db/schema";
import type { JobSummary } from "@type/jobs-ipc";
import type * as schema from "./db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

export {
  JobRepository,
  ResumeRepository,
  ChecklistRepository,
  ScoreRepository,
  WorkflowRepository,
};

type Database = BetterSQLite3Database<typeof schema>;

/**
 * The interface has some trade-off:
 *
 * 1) Repository interfaece force table to be design around jobID.
 * So when table do not need this will force to have it
 *
 * 2) findByJobId on tables with larger data (resume table) will retrieve row
 * text, origial, parsed, tailored resume all together. If this ever becomes a
 * performace bottleneck, then I will optimized and have more spesific
 * operations
 *
 * 3) The Repository interface will make each operation very similar and may be
 * tempted to create a factory but this is will sacrifice readability
 *
 * However, the trade-off is worth it on version 0.3.0 and acceptable in this
 * single user local-first desktop app.
 */
interface Repository<TSelect, TInsert = TSelect> {
  findByJobId: (jobId: string) => TSelect | null;
  create: (entity: TInsert) => boolean;
  updateByJobId: (jobId: string, data: Partial<TInsert>) => boolean;
  deleteByJobId: (jobId: string) => number;
}

class JobRepository implements Repository<schema.Job, schema.NewJob> {
  constructor(private readonly db: Database) {}

  findByJobId(id: string): schema.Job | null {
    const job = this.db.select().from(jobs).where(eq(jobs.id, id)).get();
    return job || null;
  }

  create(job: schema.NewJob): boolean {
    if (this.findByJobId(job.id)) {
      return false;
    }
    this.db.insert(jobs).values(job).run();
    return true;
  }

  getFirstN(n: number): schema.Job[] {
    return this.db.select().from(jobs).limit(n).all();
  }

  getAll(): schema.Job[] {
    return this.db.select().from(jobs).all();
  }

  updateByJobId(jobId: string, data: Partial<schema.NewJob>): boolean {
    if (!this.findByJobId(jobId)) {
      return false;
    }
    this.db.update(jobs).set(data).where(eq(jobs.id, jobId)).run();
    return true;
  }

  deleteByJobId(jobId: string): number {
    const r = this.db.delete(jobs).where(eq(jobs.id, jobId)).run();
    return r.changes;
  }

  deleteAll(): number {
    const r = this.db.delete(jobs).run();
    return r.changes;
  }

  getSummary(id: string): JobSummary | null {
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
      .where(eq(jobs.id, id))
      .get();

    if (!row) return null;

    return {
      id: row.id,
      companyName: row.companyName,
      position: row.position,
      dueDate: row.dueDate.split("T")[0],
      matchPercentage: row.matchPercentage ?? 0,
      applicationStatus: row.applicationStatus,
      jobUrl: row.jobUrl,
      pinned: row.pinned,
      pinnedAt: row.pinnedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  getSummaries(filter: { archived: boolean }): JobSummary[] {
    const rows = this.db
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
      .where(eq(jobs.archived, filter.archived ? 1 : 0))
      .orderBy(desc(jobs.createdAt))
      .all();

    return rows.map((row) => ({
      id: row.id,
      companyName: row.companyName,
      position: row.position,
      dueDate: row.dueDate.split("T")[0],
      matchPercentage: row.matchPercentage ?? 0,
      applicationStatus: row.applicationStatus,
      jobUrl: row.jobUrl,
      pinned: row.pinned,
      pinnedAt: row.pinnedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}

class ResumeRepository implements Repository<schema.Resume, schema.NewResume> {
  constructor(private readonly db: Database) {}

  findByJobId(jobId: string): schema.Resume | null {
    const resume = this.db
      .select()
      .from(resumes)
      .where(eq(resumes.jobId, jobId))
      .get();
    return resume || null;
  }

  create(resume: schema.NewResume): boolean {
    if (this.findByJobId(resume.jobId)) {
      return false;
    }
    this.db.insert(resumes).values(resume).run();
    return true;
  }

  updateByJobId(jobId: string, resumeData: Partial<schema.NewResume>): boolean {
    if (!this.findByJobId(jobId)) {
      return false;
    }
    this.db
      .update(resumes)
      .set(resumeData)
      .where(eq(resumes.jobId, jobId))
      .run();
    return true;
  }

  deleteByJobId(jobId: string): number {
    const r = this.db.delete(resumes).where(eq(resumes.jobId, jobId)).run();
    return r.changes;
  }
}

class ChecklistRepository implements Repository<
  schema.Checklist,
  schema.NewChecklist
> {
  constructor(private readonly db: Database) {}

  findByJobId(jobId: string): schema.Checklist | null {
    const checklist = this.db
      .select()
      .from(checklists)
      .where(eq(checklists.jobId, jobId))
      .get();
    return checklist || null;
  }

  create(checklist: schema.NewChecklist): boolean {
    if (this.findByJobId(checklist.jobId)) {
      return false;
    }
    this.db.insert(checklists).values(checklist).run();
    return true;
  }

  updateByJobId(jobId: string, cl: Partial<schema.NewChecklist>): boolean {
    if (!this.findByJobId(jobId)) {
      return false;
    }
    this.db.update(checklists).set(cl).where(eq(checklists.jobId, jobId)).run();
    return true;
  }

  deleteByJobId(jobId: string): number {
    const r = this.db
      .delete(checklists)
      .where(eq(checklists.jobId, jobId))
      .run();
    return r.changes;
  }
}

class ScoreRepository implements Repository<schema.Score, schema.NewScore> {
  constructor(private readonly db: Database) {}

  findByJobId(jobId: string): schema.Score | null {
    const score = this.db
      .select()
      .from(scores)
      .where(eq(scores.jobId, jobId))
      .get();
    return score || null;
  }

  create(score: schema.NewScore): boolean {
    if (this.findByJobId(score.jobId)) {
      return false;
    }
    this.db.insert(scores).values(score).run();
    return true;
  }

  updateByJobId(jobId: string, data: Partial<schema.NewScore>): boolean {
    if (!this.findByJobId(jobId)) {
      return false;
    }
    this.db.update(scores).set(data).where(eq(scores.jobId, jobId)).run();
    return true;
  }

  deleteByJobId(jobId: string): number {
    const r = this.db.delete(scores).where(eq(scores.jobId, jobId)).run();
    return r.changes;
  }
}

class WorkflowRepository implements Repository<
  schema.Workflow,
  schema.NewWorkflow
> {
  constructor(private readonly db: Database) {}

  findByJobId(jobId: string): schema.Workflow | null {
    const workflow = this.db
      .select()
      .from(workflows)
      .where(eq(workflows.jobId, jobId))
      .get();
    return workflow || null;
  }

  create(workflow: schema.NewWorkflow): boolean {
    if (this.findByJobId(workflow.jobId)) {
      return false;
    }
    this.db.insert(workflows).values(workflow).run();
    return true;
  }

  updateByJobId(jobId: string, data: Partial<schema.NewWorkflow>): boolean {
    if (!this.findByJobId(jobId)) {
      return false;
    }
    this.db.update(workflows).set(data).where(eq(workflows.jobId, jobId)).run();
    return true;
  }

  deleteByJobId(jobId: string): number {
    const r = this.db.delete(workflows).where(eq(workflows.jobId, jobId)).run();
    return r.changes;
  }
}
