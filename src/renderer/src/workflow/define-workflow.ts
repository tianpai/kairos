/**
 * Workflow Definition Factory
 *
 * Provides a type-safe way to define workflows as pure data.
 * The factory validates at compile time that:
 * 1. All task names are valid
 * 2. Prerequisites reference tasks that exist in the workflow
 *
 * Usage:
 * ```typescript
 * export const myWorkflow = defineWorkflow({
 *   name: 'my-workflow',
 *   tasks: {
 *     'task.a': { after: [] },
 *     'task.b': { after: ['task.a'] },
 *   },
 * })
 * ```
 */

import type { TaskName } from './task-contracts'

// =============================================================================
// Type-Level Workflow Validation
// =============================================================================

type NoInfer<T> = [T][T extends unknown ? 0 : never]

/**
 * Task step in a workflow - defines prerequisites
 */
export interface TaskStep<TWorkflowTasks extends TaskName = TaskName> {
  /** Tasks that must complete before this one runs */
  after: Array<NoInfer<TWorkflowTasks>>
}

/**
 * Workflow definition with compile-time task validation
 *
 * @template TTasks - The set of task names in this workflow (inferred)
 */
export interface WorkflowDef<TTasks extends TaskName = TaskName> {
  /** Unique workflow identifier */
  name: string

  /**
   * Tasks in this workflow.
   * Keys must be valid TaskNames from TaskContracts.
   * 'after' arrays can only reference other tasks in this workflow.
   */
  tasks: {
    [K in TTasks]: TaskStep<TTasks>
  }
}

/**
 * Runtime workflow instance
 */
export interface Workflow {
  readonly name: string
  readonly tasks: ReadonlyMap<TaskName, ReadonlySet<TaskName>>
}

/**
 * Global workflow registry
 */
const workflowRegistry = new Map<string, Workflow>()

/**
 * Define a new workflow with compile-time validation
 *
 * The generic parameter is inferred from the tasks object keys,
 * ensuring that 'after' arrays can only reference tasks in the workflow.
 *
 * @example
 * ```typescript
 * export const tailoringWorkflow = defineWorkflow({
 *   name: 'tailoring',
 *   tasks: {
 *     'resume.tailoring': { after: [] },
 *     'checklist.matching': { after: ['resume.tailoring'] },
 *     'score.updating': { after: ['checklist.matching'] },
 *   },
 * })
 * ```
 */
export function defineWorkflow<TTasks extends TaskName>(
  def: WorkflowDef<TTasks>,
): Workflow {
  // Convert to runtime representation
  const tasks = new Map<TaskName, Set<TaskName>>()

  for (const [taskName, step] of Object.entries(def.tasks) as Array<
    [TTasks, TaskStep<TTasks>]
  >) {
    tasks.set(taskName, new Set(step.after))
  }

  const workflow: Workflow = {
    name: def.name,
    tasks,
  }

  // Auto-register
  workflowRegistry.set(def.name, workflow)

  return workflow
}

/**
 * Get a workflow by name
 */
export function getWorkflow(name: string): Workflow | undefined {
  return workflowRegistry.get(name)
}

/**
 * Get all registered workflows
 */
export function getAllWorkflows(): ReadonlyMap<string, Workflow> {
  return workflowRegistry
}

/**
 * Get entry tasks (tasks with no prerequisites)
 */
export function getEntryTasks(workflow: Workflow): Array<TaskName> {
  const entries: Array<TaskName> = []

  for (const [taskName, prerequisites] of workflow.tasks) {
    if (prerequisites.size === 0) {
      entries.push(taskName)
    }
  }

  return entries
}

/**
 * Get tasks that depend on a given task
 */
export function getDependentTasks(
  workflow: Workflow,
  completedTask: TaskName,
): Array<TaskName> {
  const dependents: Array<TaskName> = []

  for (const [taskName, prerequisites] of workflow.tasks) {
    if (prerequisites.has(completedTask)) {
      dependents.push(taskName)
    }
  }

  return dependents
}

/**
 * Check if all prerequisites for a task are satisfied
 */
export function arePrerequisitesSatisfied(
  workflow: Workflow,
  taskName: TaskName,
  completedTasks: Set<TaskName>,
): boolean {
  const prerequisites = workflow.tasks.get(taskName)
  if (!prerequisites) return false

  for (const prereq of prerequisites) {
    if (!completedTasks.has(prereq)) {
      return false
    }
  }

  return true
}

/**
 * Validate workflow DAG (no cycles, all references valid)
 * Returns array of error messages, empty if valid.
 */
export function validateWorkflow(workflow: Workflow): Array<string> {
  const errors: Array<string> = []
  const taskNames = new Set(workflow.tasks.keys())

  // Check all prerequisites reference existing tasks
  for (const [taskName, prerequisites] of workflow.tasks) {
    for (const prereq of prerequisites) {
      if (!taskNames.has(prereq)) {
        errors.push(`Task '${taskName}' has unknown prerequisite '${prereq}'`)
      }
    }
  }

  // Check for cycles using DFS
  const visited = new Set<TaskName>()
  const recursionStack = new Set<TaskName>()

  function hasCycle(task: TaskName): boolean {
    visited.add(task)
    recursionStack.add(task)

    const prerequisites = workflow.tasks.get(task) ?? new Set()
    for (const prereq of prerequisites) {
      if (!visited.has(prereq)) {
        if (hasCycle(prereq)) return true
      } else if (recursionStack.has(prereq)) {
        errors.push(`Cycle detected involving task '${task}'`)
        return true
      }
    }

    recursionStack.delete(task)
    return false
  }

  for (const task of taskNames) {
    if (!visited.has(task)) {
      hasCycle(task)
    }
  }

  return errors
}

// =============================================================================
// Advanced Type Utilities (for future workflow composition)
// =============================================================================

/**
 * Extract task names from a workflow definition
 */
export type WorkflowTaskNames<W extends WorkflowDef> =
  W extends WorkflowDef<infer T> ? T : never

/**
 * Merge two workflows (for composition)
 * Tasks from both workflows are combined; overlapping tasks use workflow2's definition.
 */
export function mergeWorkflows(
  name: string,
  workflow1: Workflow,
  workflow2: Workflow,
): Workflow {
  const tasks = new Map<TaskName, Set<TaskName>>()

  // Add all tasks from workflow1
  for (const [taskName, prereqs] of workflow1.tasks) {
    tasks.set(taskName, new Set(prereqs))
  }

  // Add/override with tasks from workflow2
  for (const [taskName, prereqs] of workflow2.tasks) {
    tasks.set(taskName, new Set(prereqs))
  }

  return { name, tasks }
}
