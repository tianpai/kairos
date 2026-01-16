/**
 * Workflow Store (in-memory)
 *
 * Manages workflow state for multiple concurrent jobs.
 * Each job has its own WorkflowInstance and WorkflowContext.
 */

import type { TaskName, WorkflowContext } from "@type/task-contracts";
import type { TaskStatus, WorkflowStatus } from "@type/workflow";

export type TaskStateMap = Partial<Record<TaskName, TaskStatus>>;

export interface WorkflowInstance {
  jobId: string;
  workflowName: string;
  taskStates: TaskStateMap;
  status: WorkflowStatus;
  error?: string;
}

export class WorkflowStore {
  private workflows = new Map<string, WorkflowInstance>();
  private contexts = new Map<string, WorkflowContext>();

  initWorkflow(
    jobId: string,
    workflowName: string,
    tasks: Array<TaskName>,
    initialContext: Partial<WorkflowContext>,
  ): void {
    const taskStates: TaskStateMap = {};
    tasks.forEach((task) => {
      taskStates[task] = "pending";
    });

    this.workflows.set(jobId, {
      jobId,
      workflowName,
      taskStates,
      status: "running",
    });

    this.contexts.set(jobId, {
      jobId,
      ...initialContext,
    } as WorkflowContext);
  }

  loadWorkflow(
    jobId: string,
    workflow: WorkflowInstance,
    context?: WorkflowContext,
  ): void {
    this.workflows.set(jobId, workflow);
    if (context) {
      this.contexts.set(jobId, context);
    }
  }

  setTaskStatus(
    jobId: string,
    task: TaskName,
    status: TaskStatus,
    error?: string,
  ): void {
    const workflow = this.workflows.get(jobId);
    if (!workflow) return;

    this.workflows.set(jobId, {
      ...workflow,
      taskStates: {
        ...workflow.taskStates,
        [task]: status,
      },
      error: error ?? workflow.error,
    });
  }

  updateContext(jobId: string, updates: Partial<WorkflowContext>): void {
    const context = this.contexts.get(jobId);
    if (!context) return;

    this.contexts.set(jobId, {
      ...context,
      ...updates,
    });
  }

  completeWorkflow(jobId: string): void {
    const workflow = this.workflows.get(jobId);
    if (!workflow) return;

    this.workflows.set(jobId, {
      ...workflow,
      status: "completed",
    });
  }

  failWorkflow(jobId: string, error: string): void {
    const workflow = this.workflows.get(jobId);
    if (!workflow) return;

    this.workflows.set(jobId, {
      ...workflow,
      status: "failed",
      error,
    });
  }

  clearWorkflow(jobId: string): void {
    this.workflows.delete(jobId);
    this.contexts.delete(jobId);
  }

  getWorkflow(jobId: string): WorkflowInstance | undefined {
    return this.workflows.get(jobId);
  }

  getContext(jobId: string): WorkflowContext | undefined {
    return this.contexts.get(jobId);
  }

  getTaskStatus(jobId: string, task: TaskName): TaskStatus | undefined {
    return this.workflows.get(jobId)?.taskStates[task];
  }

  isTaskRunning(jobId: string, task: TaskName): boolean {
    return this.getTaskStatus(jobId, task) === "running";
  }

  isWorkflowRunning(jobId: string): boolean {
    return this.workflows.get(jobId)?.status === "running";
  }

  hasFailedTask(jobId: string): boolean {
    const workflow = this.workflows.get(jobId);
    return workflow
      ? Object.values(workflow.taskStates).some((s) => s === "failed")
      : false;
  }
}
