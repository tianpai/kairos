/**
 * Workflow Definition Factory
 *
 * Provides a type-safe way to define workflows as pure data.
 */

import type { TaskName } from "@type/task-contracts";

export {
  type Workflow,
  defineWorkflow,
  getWorkflow,
  arePrerequisitesSatisfied,
  getEntryTasks,
};

// =============================================================================
// Types
// =============================================================================

/** Task step in a workflow - defines prerequisites */
interface WorkflowStep {
  after: readonly TaskName[];
}

/**
 * Workflow definition
 * @template TTasks - The set of task names in this workflow (inferred)
 */
interface WorkflowDefinition<TTasks extends TaskName = TaskName> {
  /** Unique workflow identifier */
  name: string;

  /**
   * Tasks in this workflow.
   * 'after' arrays can only reference other tasks in the workflow.
   */
  tasks: Record<TTasks, WorkflowStep>;
}

/** Runtime workflow instance */
interface Workflow {
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
 * Define and register a workflow
 */
function defineWorkflow<TaskName>(
  definition: WorkflowDefinition<TTasks>,
): void {
  const tasks = new Map<TaskName, Set<TaskName>>();

  for (const [taskName, step] of Object.entries(definition.tasks) as [
    TaskName,
    WorkflowStep,
  ][]) {
    tasks.set(taskName, new Set(step.after));
  }

  workflowRegistry.set(definition.name, { name: definition.name, tasks });
}

/**
 * Get a workflow by name
 */
function getWorkflow(name: string): Workflow | undefined {
  return workflowRegistry.get(name);
}

/**
 * Get entry tasks (no prerequisites)
 */
function getEntryTasks(workflow: Workflow): TaskName[] {
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
function arePrerequisitesSatisfied(
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
