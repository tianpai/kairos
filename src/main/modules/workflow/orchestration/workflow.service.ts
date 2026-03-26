import { initAIClient } from "../../ai";
import {
  ChecklistRepository,
  JobRepository,
  ResumeRepository,
  ScoreRepository,
  WorkflowRepository,
} from "../../persistence";
import { WorkflowEngine } from "../engine/workflow-engine";
import { registerWorkflowTasks } from "../tasks";
import type { AiPreferencesStore } from "../../ai";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { PersistenceSchema } from "../../persistence";
import type { WorkflowStepsData } from "@type/workflow";
import type { TaskName } from "@type/task-contracts";
import "../definitions/workflows";

type Database = BetterSQLite3Database<PersistenceSchema>;

export class WorkflowService {
  private readonly engine: WorkflowEngine;
  private readonly workflowRepo: WorkflowRepository;

  constructor(db: Database, aiPreferences: AiPreferencesStore) {
    const aiClient = initAIClient(aiPreferences);
    const jobRepo = new JobRepository(db);
    const resumeRepo = new ResumeRepository(db);
    const checklistRepo = new ChecklistRepository(db);
    const scoreRepo = new ScoreRepository(db);
    this.workflowRepo = new WorkflowRepository(db);

    registerWorkflowTasks();
    this.engine = new WorkflowEngine(this.workflowRepo, {
      aiClient,
      jobRepo,
      resumeRepo,
      checklistRepo,
      scoreRepo,
    });
  }

  startWorkflow(workflowName: string, jobId: string): Promise<void> {
    return this.engine.startWorkflow(workflowName, jobId);
  }

  retryFailedTasks(jobId: string): Promise<TaskName[]> {
    return this.engine.retryFailedTasks(jobId);
  }

  async getWorkflowState(jobId: string): Promise<WorkflowStepsData | null> {
    const active = this.engine.getWorkflowSteps(jobId);
    if (active) return active;

    const row = this.workflowRepo.findByJobId(jobId);
    if (!row) {
      // TODO: (workflow) Decide explicit contract for missing workflow row:
      // return null, auto-create, or throw a typed not-found error.
      throw new Error(`Job application with ID ${jobId} not found`);
    }

    const workflowSteps = row.state as WorkflowStepsData | null;
    if (!workflowSteps) return null;

    const { recovered, wasStale } =
      this.engine.recoverStaleWorkflow(workflowSteps);

    if (wasStale) {
      this.workflowRepo.updateByJobId(jobId, {
        state: recovered as unknown as Record<string, unknown>,
      });
    }

    return recovered;
  }
}
