/**
 * Workflow Engine
 *
 * Executes workflows using the task and workflow registries.
 * Responsibilities:
 * - Start workflows with initial context
 * - Run tasks when prerequisites are satisfied
 * - Update context with task outputs
 * - Handle failures and retries
 * - Persist workflow state to DB
 * - Emit workflow events for renderer updates
 */

import log from "electron-log/main";
import type { TaskName, WorkflowContext } from "@type/task-contracts";
import type { TaskStatus, WorkflowStepsData } from "@type/workflow";
import type { JobApplicationService } from "../services/job-application.service";
import { getMissingInputs, getTask, resolveTaskInput } from "./define-task";
import {
  arePrerequisitesSatisfied,
  getEntryTasks,
  getWorkflow,
} from "./define-workflow";
import { emitWorkflowEvent } from "./workflow-events";
import { WorkflowStore } from "./workflow-store";
import type { Task, TaskExecutionMeta } from "./define-task";
import type { Workflow } from "./define-workflow";
import type { TaskStateMap, WorkflowInstance } from "./workflow-store";

export class WorkflowEngine {
  private store = new WorkflowStore();

  constructor(private readonly jobService: JobApplicationService) {}

  /**
   * Start a workflow for a job
   */
  async startWorkflow(
    workflowName: string,
    jobId: string,
    initialContext: Partial<WorkflowContext>,
  ): Promise<void> {
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

    // Get task names array
    const tasks = Array.from(workflow.tasks.keys());

    // Initialize workflow in store
    this.store.initWorkflow(jobId, workflowName, tasks, initialContext);

    // Persist initial state
    const workflowInstance = this.store.getWorkflow(jobId)!;
    await this.persistWorkflow(jobId, workflowInstance);
    this.emitStateChanged(jobId);

    // Start entry tasks
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
  async retryFailedTasks(jobId: string): Promise<Array<TaskName>> {
    const workflowInstance = this.store.getWorkflow(jobId);

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

    // Find failed tasks
    const failedTasks: Array<TaskName> = [];
    const resetTaskStates: TaskStateMap = { ...workflowInstance.taskStates };

    for (const [taskName, status] of Object.entries(
      workflowInstance.taskStates,
    )) {
      if (status === "failed") {
        failedTasks.push(taskName as TaskName);
        resetTaskStates[taskName as TaskName] = "pending";
      }
    }

    // Reset workflow state
    this.store.loadWorkflow(jobId, {
      ...workflowInstance,
      taskStates: resetTaskStates,
      status: "running",
      error: undefined,
    });

    // Persist and restart
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
   * Called when loading workflow state from DB on app start/navigation.
   */
  recoverStaleWorkflow(workflowSteps: WorkflowStepsData): {
    recovered: WorkflowStepsData;
    wasStale: boolean;
  } {
    if (workflowSteps.status !== "running") {
      return { recovered: workflowSteps, wasStale: false };
    }

    // Workflow was "running" - mark as failed (interrupted)
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
      await this.jobService.saveWorkflowState(jobId, {
        workflowSteps: this.toWorkflowSteps(workflow),
        workflowStatus: workflow.status,
      });
    } catch (error) {
      log.error("[WorkflowEngine] Failed to persist workflow state:", error);
    }
  }

  private emitStateChanged(jobId: string): void {
    const workflow = this.store.getWorkflow(jobId);
    if (!workflow) return;
    emitWorkflowEvent("workflow:stateChanged", {
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
   * Run a task if it's ready (prerequisites met and inputs available)
   */
  private async runTaskIfReady(
    workflow: Workflow,
    jobId: string,
    taskName: TaskName,
  ): Promise<void> {
    const workflowInstance = this.store.getWorkflow(jobId);
    const context = this.store.getContext(jobId);

    if (!workflowInstance || !context) {
      return;
    }

    const status = workflowInstance.taskStates[taskName];
    if (status !== "pending") {
      return;
    }

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

    // Check inputs
    const task = getTask(taskName);
    if (!task) {
      await this.failTask(jobId, taskName, `Task ${taskName} not registered`);
      return;
    }

    const input = resolveTaskInput(task, context);
    if (input === null) {
      const missing = getMissingInputs(task, context);
      log.debug(
        `[WorkflowEngine] Task ${taskName} blocked on inputs: ${missing.join(", ")}`,
      );
      return;
    }

    // Run the task
    await this.executeTask(workflow, jobId, task, input);
  }

  /**
   * Execute a task
   */
  private async executeTask<T extends TaskName>(
    workflow: Workflow,
    jobId: string,
    task: Task<T>,
    input: Parameters<Task<T>["execute"]>[0],
  ): Promise<void> {
    const taskName = task.name;

    // Verify workflow is still running
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
      const meta: TaskExecutionMeta = {
        jobId,
        taskName,
        emitPartial: task.streaming
          ? (partial) => {
              emitWorkflowEvent("workflow:aiPartial", {
                jobId,
                taskName,
                partial,
              });
            }
          : undefined,
      };

      // Execute
      const result = await task.execute(input, meta);

      // Persist task result
      await task.onSuccess(jobId, result);

      // Update context if task provides a key
      if (task.provides) {
        this.store.updateContext(jobId, { [task.provides]: result });
      }

      // Mark completed
      this.store.setTaskStatus(jobId, taskName, "completed");
      log.info(`[WorkflowEngine] Task completed: ${taskName}`);

      // Persist workflow state
      const updatedWorkflow = this.store.getWorkflow(jobId)!;
      await this.persistWorkflow(jobId, updatedWorkflow);

      // Emit completion event for renderer UI
      emitWorkflowEvent("workflow:taskCompleted", {
        jobId,
        taskName,
        provides: task.provides,
        result: task.provides ? (result as unknown) : undefined,
        tipEvent: task.tipEvent,
        tipData: task.getTipData ? task.getTipData(result as never) : undefined,
      });
      this.emitStateChanged(jobId);

      // Start dependent tasks
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
    const context = this.store.getContext(jobId);

    if (
      !workflowInstance ||
      workflowInstance.status !== "running" ||
      !context
    ) {
      return;
    }

    // Find ready tasks
    const readyTasks: Array<TaskName> = [];
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
        const task = getTask(taskName as TaskName);
        if (task && resolveTaskInput(task, context) !== null) {
          readyTasks.push(taskName as TaskName);
        }
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

        const tipPayload = this.getTipPayload(jobId, completedWorkflow);

        emitWorkflowEvent("workflow:completed", {
          jobId,
          workflowName: workflowInstance.workflowName,
          status: "completed",
          ...tipPayload,
        });
        this.emitStateChanged(jobId);
        this.store.clearWorkflow(jobId);
      }
      return;
    }

    // Start ready tasks in parallel
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

  private getTipPayload(
    jobId: string,
    workflowInstance: WorkflowInstance,
  ): { tipEvent?: string; tipData?: Record<string, unknown> } {
    const context = this.store.getContext(jobId);
    if (!context) return {};

    for (const [taskName, status] of Object.entries(
      workflowInstance.taskStates,
    )) {
      if (status !== "completed") continue;
      const task = getTask(taskName as TaskName);
      if (task?.tipEvent) {
        const tipData =
          task.provides && task.getTipData
            ? task.getTipData(
                context[task.provides as keyof typeof context] as never,
              )
            : {};
        return { tipEvent: task.tipEvent, tipData };
      }
    }

    return {};
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

    // Persist failure
    const failedWorkflow = this.store.getWorkflow(jobId)!;
    await this.persistWorkflow(jobId, failedWorkflow);

    emitWorkflowEvent("workflow:taskFailed", {
      jobId,
      taskName,
      error,
    });
    this.emitStateChanged(jobId);
  }
}
