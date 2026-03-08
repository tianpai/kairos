/**
 * Workflow Definition Factory
 *
 * Provides a type-safe way to define workflows as pure data.
 */

import type { TaskName } from "@type/task-contracts";

// =============================================================================
// Types
// =============================================================================

/** Task step in a workflow - defines prerequisites */
export interface WorkflowStep {
  after: readonly TaskName[];
}

/**
 * Workflow definition
 * @template TTasks - The set of task names in this workflow (inferred)
 */
export interface WorkflowDefinition<TTasks extends TaskName = TaskName> {
  /** Unique workflow identifier */
  name: string;

  /**
   * Tasks in this workflow.
   * 'after' arrays can only reference other tasks in the workflow.
   */
  tasks: Record<TTasks, WorkflowStep>;
}

/** Runtime workflow instance */
export interface Workflow {
  name: string;
  tasks: Map<TaskName, Set<TaskName>>;
}

// =============================================================================
// Registry
// =============================================================================

/** Global workflow registry */
const workflowRegistry = new Map<string, Workflow>();

// =============================================================================
// Public API
// =============================================================================

/**
 * Get a workflow by name
 */
export function getWorkflow(name: string): Workflow | undefined {
  return workflowRegistry.get(name);
}

/**
 * Get entry tasks (no prerequisites)
 */
export function getEntryTasks(workflow: Workflow): TaskName[] {
  const entryTasks: TaskName[] = [];

  for (const [taskName, prerequisites] of workflow.tasks) {
    if (prerequisites.size === 0) {
      entryTasks.push(taskName);
    }
  }

  return entryTasks;
}

/**
 * Check if a task's prerequisites are satisfied
 */
export function arePrerequisitesSatisfied(
  workflow: Workflow,
  taskName: TaskName,
  completed: Set<TaskName>,
): boolean {
  const prerequisites = workflow.tasks.get(taskName);
  if (!prerequisites) return false;

  for (const prereq of prerequisites) {
    if (!completed.has(prereq)) {
      return false;
    }
  }

  return true;
}
