/**
 * Workflow Engine
 *
 * Pure DAG runner. Tasks are self-contained (read DB → run → write DB).
 * Engine only tracks task statuses and ordering.
 */

import log from "electron-log/main";
import { getTask } from "../definitions/task-registry";
import {
  arePrerequisitesSatisfied,
  getEntryTasks,
  getWorkflow,
} from "../definitions/workflow-registry";
import { emitWorkflowEvent } from "../events/workflow-events";
import { WorkflowStore } from "../state/workflow-store";
import type { TaskStatus, WorkflowStepsData } from "@type/workflow";
import type { TaskName } from "@type/task-contracts";
import type { TaskConfig } from "../definitions/task-registry";
import type { Workflow } from "../definitions/workflow-registry";
import type { TaskStateMap, WorkflowInstance } from "../state/workflow-store";
import type { TaskDeps } from "../tasks/task-deps";
import type { WorkflowRepository } from "../../persistence";

export class WorkflowEngine {
  private store = new WorkflowStore();

  constructor(
    private readonly workflowRepo: WorkflowRepository,
    private readonly taskDeps: TaskDeps,
  ) {}

  /**
   * Start a workflow for a job
   */
  async startWorkflow(workflowName: string, jobId: string): Promise<void> {
    log.info(`[WorkflowEngine] Starting '${workflowName}' for job ${jobId}`);

    const workflow = getWorkflow(workflowName);
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }

    // Validate all tasks in workflow are registered
    for (const taskName of workflow.tasks.keys()) {
      if (!getTask(taskName)) {
        throw new Error(
          `Workflow '${workflowName}' references unregistered task: ${taskName}`,
        );
      }
    }

    const tasks = Array.from(workflow.tasks.keys());

    this.store.initWorkflow(jobId, workflowName, tasks);

    const workflowInstance = this.store.getWorkflow(jobId)!;
    await this.persistWorkflow(jobId, workflowInstance);
    this.emitStateChanged(jobId);

    const entryTasks = getEntryTasks(workflow);
    log.info(`[WorkflowEngine] Entry tasks: ${entryTasks.join(", ")}`);

    for (const taskName of entryTasks) {
      void this.runTaskIfReady(workflow, jobId, taskName).catch((error) => {
        log.error(
          `[WorkflowEngine] Failed to run entry task ${taskName} for job ${jobId}`,
          error,
        );
      });
    }
  }

  /**
   * Retry failed tasks in a workflow
   */
  async retryFailedTasks(jobId: string): Promise<TaskName[]> {
    const workflowInstance = this.store.getWorkflow(jobId);

    // TODO: (workflow) Hydrate failed workflow state from DB when in-memory
    // state is missing (e.g. app restart) so retry remains durable.
    if (!workflowInstance) {
      throw new Error(`No workflow instance for job ${jobId}`);
    }

    if (workflowInstance.status !== "failed") {
      throw new Error("Can only retry failed workflows");
    }

    const workflow = getWorkflow(workflowInstance.workflowName);
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowInstance.workflowName}`);
    }

    const failedTasks: TaskName[] = [];
    const resetTaskStates: TaskStateMap = { ...workflowInstance.taskStates };

    for (const [taskName, status] of Object.entries(
      workflowInstance.taskStates,
    )) {
      if (status === "failed") {
        failedTasks.push(taskName as TaskName);
        resetTaskStates[taskName as TaskName] = "pending";
      }
    }

    this.store.loadWorkflow(jobId, {
      ...workflowInstance,
      taskStates: resetTaskStates,
      status: "running",
      error: undefined,
    });

    const updatedWorkflow = this.store.getWorkflow(jobId)!;
    await this.persistWorkflow(jobId, updatedWorkflow);
    this.emitStateChanged(jobId);
    await this.startReadyTasks(workflow, jobId);

    return failedTasks;
  }

  /**
   * Return the in-memory workflow instance, if present.
   */
  getWorkflow(jobId: string): WorkflowInstance | undefined {
    return this.store.getWorkflow(jobId);
  }

  getWorkflowSteps(jobId: string): WorkflowStepsData | null {
    const workflow = this.store.getWorkflow(jobId);
    return workflow ? this.toWorkflowSteps(workflow) : null;
  }

  /**
   * Detect and fix stale "running" states from interrupted workflows.
   */
  recoverStaleWorkflow(workflowSteps: WorkflowStepsData): {
    recovered: WorkflowStepsData;
    wasStale: boolean;
  } {
    if (workflowSteps.status !== "running") {
      return { recovered: workflowSteps, wasStale: false };
    }

    const recoveredTaskStates: Record<string, TaskStatus> = {};

    for (const [task, status] of Object.entries(workflowSteps.taskStates)) {
      recoveredTaskStates[task] = status === "running" ? "failed" : status;
    }

    return {
      recovered: {
        ...workflowSteps,
        status: "failed",
        taskStates: recoveredTaskStates,
        error: "Workflow was interrupted",
      },
      wasStale: true,
    };
  }

  /**
   * Persist workflow state to DB
   */
  private async persistWorkflow(
    jobId: string,
    workflow: WorkflowInstance,
  ): Promise<void> {
    try {
      // TODO: (workflow): Ensure workflows row exists for new jobs (upsert here
      // or create row during job creation) so state persistence is reliable.
      this.workflowRepo.updateByJobId(jobId, {
        state: this.toWorkflowSteps(workflow) as unknown as Record<
          string,
          unknown
        >,
      });
    } catch (error) {
      log.error("[WorkflowEngine] Failed to persist workflow state:", error);
    }
  }

  private emitStateChanged(jobId: string): void {
    const workflow = this.store.getWorkflow(jobId);
    if (!workflow) return;
    emitWorkflowEvent("workflow:pushState", {
      type: "stateChanged",
      jobId,
      workflow: this.toWorkflowSteps(workflow),
    });
  }

  private toWorkflowSteps(workflow: WorkflowInstance): WorkflowStepsData {
    return {
      workflowName: workflow.workflowName,
      taskStates: workflow.taskStates as Record<string, TaskStatus>,
      status: workflow.status,
      ...(workflow.error ? { error: workflow.error } : {}),
    };
  }

  /**
   * Run a task if it's ready (prerequisites met + status is pending)
   */
  private async runTaskIfReady(
    workflow: Workflow,
    jobId: string,
    taskName: TaskName,
  ): Promise<void> {
    const workflowInstance = this.store.getWorkflow(jobId);
    if (!workflowInstance) return;

    const status = workflowInstance.taskStates[taskName];
    if (status !== "pending") return;

    // Check prerequisites
    const completedTasks = new Set<TaskName>();
    for (const [name, s] of Object.entries(workflowInstance.taskStates)) {
      if (s === "completed") {
        completedTasks.add(name as TaskName);
      }
    }

    if (!arePrerequisitesSatisfied(workflow, taskName, completedTasks)) {
      log.debug(`[WorkflowEngine] Task ${taskName} waiting on prerequisites`);
      return;
    }

    const task = getTask(taskName);
    if (!task) {
      await this.failTask(jobId, taskName, `Task ${taskName} not registered`);
      return;
    }

    await this.executeTask(workflow, jobId, task);
  }

  /**
   * Execute a task
   */
  private async executeTask(
    workflow: Workflow,
    jobId: string,
    task: TaskConfig,
  ): Promise<void> {
    const taskName = task.name;

    const workflowInstance = this.store.getWorkflow(jobId);
    if (!workflowInstance || workflowInstance.status !== "running") {
      log.warn(
        `[WorkflowEngine] Task ${taskName} skipped - workflow not running for job ${jobId}`,
      );
      return;
    }

    log.info(`[WorkflowEngine] Running task: ${taskName}`);
    this.store.setTaskStatus(jobId, taskName, "running");
    this.emitStateChanged(jobId);

    try {
      const emitPartial = task.streaming
        ? (partial: unknown) => {
            emitWorkflowEvent("workflow:aiPartial", {
              jobId,
              taskName,
              partial,
            });
          }
        : undefined;

      await task.execute(jobId, this.taskDeps, emitPartial);

      this.store.setTaskStatus(jobId, taskName, "completed");
      log.info(`[WorkflowEngine] Task completed: ${taskName}`);

      const updatedWorkflow = this.store.getWorkflow(jobId)!;
      await this.persistWorkflow(jobId, updatedWorkflow);

      emitWorkflowEvent("workflow:pushState", {
        type: "taskCompleted",
        jobId,
        taskName,
      });
      this.emitStateChanged(jobId);

      await this.startReadyTasks(workflow, jobId);
    } catch (error) {
      log.error(`[WorkflowEngine] Task ${taskName} execution failed:`, error);
      const message = error instanceof Error ? error.message : String(error);
      await this.failTask(jobId, taskName, message);
    }
  }

  /**
   * Start all tasks that are ready to run
   */
  private async startReadyTasks(
    workflow: Workflow,
    jobId: string,
  ): Promise<void> {
    const workflowInstance = this.store.getWorkflow(jobId);
    if (!workflowInstance || workflowInstance.status !== "running") return;

    const readyTasks: TaskName[] = [];
    const completedTasks = new Set<TaskName>();

    for (const [name, status] of Object.entries(workflowInstance.taskStates)) {
      if (status === "completed") {
        completedTasks.add(name as TaskName);
      }
    }

    for (const [taskName, status] of Object.entries(
      workflowInstance.taskStates,
    )) {
      if (status !== "pending") continue;

      if (
        arePrerequisitesSatisfied(
          workflow,
          taskName as TaskName,
          completedTasks,
        )
      ) {
        readyTasks.push(taskName as TaskName);
      }
    }

    // Check if workflow is complete
    if (readyTasks.length === 0) {
      const allCompleted = Object.values(workflowInstance.taskStates).every(
        (s) => s === "completed",
      );
      if (allCompleted) {
        this.store.completeWorkflow(jobId);
        const completedWorkflow = this.store.getWorkflow(jobId)!;
        await this.persistWorkflow(jobId, completedWorkflow);
        log.info(
          `[WorkflowEngine] Workflow '${workflowInstance.workflowName}' completed`,
        );

        emitWorkflowEvent("workflow:pushState", {
          type: "completed",
          jobId,
          workflowName: workflowInstance.workflowName,
          status: "completed",
        });
        this.emitStateChanged(jobId);
        this.store.clearWorkflow(jobId);
      }
      return;
    }

    log.info(
      `[WorkflowEngine] Starting ${readyTasks.length} ready task(s): ${readyTasks.join(", ")}`,
    );
    for (const taskName of readyTasks) {
      void this.runTaskIfReady(workflow, jobId, taskName).catch((error) => {
        log.error(
          `[WorkflowEngine] Failed to run task ${taskName} for job ${jobId}`,
          error,
        );
      });
    }
  }

  /**
   * Fail a task and the workflow
   */
  private async failTask(
    jobId: string,
    taskName: TaskName,
    error: string,
  ): Promise<void> {
    log.error(`[WorkflowEngine] Task ${taskName} failed: ${error}`);

    this.store.setTaskStatus(jobId, taskName, "failed", error);
    this.store.failWorkflow(jobId, `Task ${taskName} failed: ${error}`);

    const failedWorkflow = this.store.getWorkflow(jobId)!;
    await this.persistWorkflow(jobId, failedWorkflow);

    emitWorkflowEvent("workflow:pushState", {
      type: "taskFailed",
      jobId,
      taskName,
      error,
    });
    this.emitStateChanged(jobId);
  }
}
