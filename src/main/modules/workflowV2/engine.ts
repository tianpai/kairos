import log from "electron-log/main";
import { emitWorkflowEvent } from "./workflow-events";
import type { BaseTask, TaskError, TaskName } from "./tasks/task-base";
import type { WorkflowDef } from "./workflow";
import type { WorkflowRepository } from "../persistence";

export interface TaskState {
  status: "pending" | "running" | "completed" | "failed";
  error?: TaskError;
}

export interface WfState {
  workflowName: string;
  tasks: Record<TaskName, TaskState>;
}

export class WfEngine {
  private readonly activeJobs = new Set<string>();

  constructor(
    private readonly workflowRepo: WorkflowRepository,
    private readonly tasks: Map<TaskName, BaseTask>,
    private readonly workflows: Map<string, WorkflowDef>,
  ) {}

  async start(jobId: string, workflowName: string): Promise<void> {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }

    const existing = this.readState(jobId);
    if (existing) {
      throw new Error(`Job ${jobId} already has a workflow running`);
    }

    // Init all tasks to pending
    const tasks: Record<string, TaskState> = {};
    for (const taskName of workflow.prerequisites.keys()) {
      tasks[taskName] = { status: "pending" };
    }

    const state: WfState = { workflowName, tasks };
    this.writeState(jobId, state);
    this.emitStateChanged(jobId, state);

    this.activeJobs.add(jobId);
    log.info(`[WorkflowEngine] Starting '${workflowName}' for job ${jobId}`);

    // Fire entry tasks
    const entryTasks = this.getEntryTasks(workflow);
    for (const taskName of entryTasks) {
      void this.executeTask(jobId, taskName, workflow);
    }
  }

  async retry(jobId: string): Promise<void> {
    const state = this.readState(jobId);
    if (!state) {
      throw new Error(`No workflow state for job ${jobId}`);
    }

    const workflow = this.workflows.get(state.workflowName);
    if (!workflow) {
      throw new Error(`Unknown workflow: ${state.workflowName}`);
    }

    // Reset failed tasks to pending, clear their errors
    for (const [taskName, taskState] of Object.entries(state.tasks)) {
      if (taskState.status === "failed") {
        state.tasks[taskName as TaskName] = { status: "pending" };
      }
    }

    this.writeState(jobId, state);
    this.emitStateChanged(jobId, state);

    this.activeJobs.add(jobId);
    log.info(`[Engine] Retrying '${state.workflowName}' for job ${jobId}`);

    this.startReadyTasks(jobId, workflow);
  }

  getState(jobId: string): WfState | null {
    const state = this.readState(jobId);
    if (!state) return null;

    // If this engine instance is actively running tasks for this job,
    // "running" status is legitimate — skip recovery
    if (this.activeJobs.has(jobId)) return state;

    // Recover stale "running" tasks (app crash mid-workflow)
    let stale = false;
    for (const [taskName, taskState] of Object.entries(state.tasks)) {
      if (taskState.status === "running") {
        state.tasks[taskName as TaskName] = {
          status: "failed",
          error: { message: "Workflow was interrupted", retryable: true },
        };
        stale = true;
      }
    }

    if (stale) {
      this.writeState(jobId, state);
      this.emitStateChanged(jobId, state);
    }

    return state;
  }

  // DAG Resolution

  private getEntryTasks(w: WorkflowDef): TaskName[] {
    const entry: TaskName[] = [];
    for (const [task, prereqs] of w.prerequisites) {
      if (prereqs.size === 0) entry.push(task);
    }
    return entry;
  }

  private getReadyTasks(
    w: WorkflowDef,
    t: Record<TaskName, TaskState>,
  ): TaskName[] {
    const ready: TaskName[] = [];
    for (const [taskName, prereqs] of w.prerequisites) {
      if (t[taskName]?.status !== "pending") continue;
      const allMet = [...prereqs].every((p) => t[p]?.status === "completed");
      if (allMet) ready.push(taskName);
    }
    return ready;
  }

  // Execution

  private async executeTask(
    jobId: string,
    taskName: TaskName,
    w: WorkflowDef,
  ): Promise<void> {
    const task = this.tasks.get(taskName);
    if (!task) {
      this.failTask(jobId, taskName, {
        message: `Task ${taskName} not registered`,
        retryable: false,
      });
      return;
    }

    // Mark running
    this.updateTaskState(jobId, taskName, { status: "running" });
    log.info(`[Engine] Running: ${taskName}`);

    try {
      const error = await task.run(jobId);

      if (error) {
        this.failTask(jobId, taskName, error);
        return;
      }

      // Mark completed
      this.updateTaskState(jobId, taskName, { status: "completed" });
      log.info(`[Engine] Completed: ${taskName}`);

      this.startReadyTasks(jobId, w);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.failTask(jobId, taskName, { message, retryable: true });
    }
  }

  /**
   * TODO: add and improve doc string
   *
   * > [!IMPORTANT]
   * > when all tasks in this workflow are completed, workflow state field in
   * > db will reset to null
   */
  private startReadyTasks(jobId: string, w: WorkflowDef): void {
    const state = this.readState(jobId);
    if (!state) return;

    const ready = this.getReadyTasks(w, state.tasks);

    if (ready.length > 0) {
      for (const taskName of ready) {
        void this.executeTask(jobId, taskName, w);
      }
      return;
    }

    // No ready tasks — check if all completed
    const allDone = Object.values(state.tasks).every(
      (t) => t.status === "completed",
    );

    if (allDone) {
      this.activeJobs.delete(jobId);
      this.writeState(jobId, null);
      this.emitStateChanged(jobId, null);
      log.info(
        `[Engine] Workflow '${state.workflowName}' completed for job ${jobId}`,
      );
    } else {
      // Some tasks failed, no more progress possible
      this.activeJobs.delete(jobId);
    }
  }

  // State

  private readState(jobId: string): WfState | null {
    const row = this.workflowRepo.findByJobId(jobId);
    // TODO: better typing on the schema's state column
    return (row?.state as unknown as WfState) ?? null;
  }

  private writeState(jobId: string, state: WfState | null): void {
    this.workflowRepo.updateByJobId(jobId, {
      state: state as unknown as Record<string, unknown> | null,
    });
  }

  private updateTaskState(
    jobId: string,
    taskName: TaskName,
    taskState: TaskState,
  ): void {
    const state = this.readState(jobId);
    if (!state) return;
    state.tasks[taskName] = taskState;
    this.writeState(jobId, state);
    this.emitStateChanged(jobId, state);
  }

  private failTask(jobId: string, taskName: TaskName, error: TaskError): void {
    log.error(`[WorkflowEngine] Failed: ${taskName} — ${error.message}`);
    this.updateTaskState(jobId, taskName, { status: "failed", error });
  }

  // Events

  private emitStateChanged(jobId: string, state: WfState | null): void {
    emitWorkflowEvent("workflow:pushState", { jobId, state });
  }
}
