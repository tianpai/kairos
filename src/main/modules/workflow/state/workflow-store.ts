/**
 * Workflow Store (in-memory)
 *
 * Manages workflow state for multiple concurrent jobs.
 * Pure state machine — no context, no payloads.
 */

import type { TaskName } from "@type/task-contracts";
import type { TaskStatus, WorkflowStatus } from "@type/workflow";

export { TaskStateMap, WorkflowInstance, WorkflowStore };

type TaskStateMap = Partial<Record<TaskName, TaskStatus>>;

interface WorkflowInstance {
  jobId: string;
  workflowName: string;
  taskStates: TaskStateMap;
  status: WorkflowStatus;
  error?: string;
}

class WorkflowStore {
  private workflows = new Map<string, WorkflowInstance>();

  initWorkflow(jobId: string, workflowName: string, tasks: TaskName[]): void {
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
  }

  loadWorkflow(jobId: string, workflow: WorkflowInstance): void {
    this.workflows.set(jobId, workflow);
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
  }

  getWorkflow(jobId: string): WorkflowInstance | undefined {
    return this.workflows.get(jobId);
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
