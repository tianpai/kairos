/**
 * Workflow Definition Factory
 *
 * Provides a type-safe way to define workflows as pure data.
 */

import type { TaskName } from '@type/task-contracts'

// =============================================================================
// Types
// =============================================================================

/** Task step in a workflow - defines prerequisites */
export interface WorkflowStep {
  after: ReadonlyArray<TaskName>
}

/**
 * Workflow definition
 * @template TTasks - The set of task names in this workflow (inferred)
 */
export interface WorkflowDefinition<TTasks extends TaskName = TaskName> {
  /** Unique workflow identifier */
  name: string

  /**
   * Tasks in this workflow.
   * 'after' arrays can only reference other tasks in the workflow.
   */
  tasks: Record<TTasks, WorkflowStep>
}

/** Runtime workflow instance */
export interface Workflow {
  name: string
  tasks: Map<TaskName, Set<TaskName>>
}

// =============================================================================
// Registry
// =============================================================================

/** Global workflow registry */
const workflowRegistry = new Map<string, Workflow>()

// =============================================================================
// Public API
// =============================================================================

/**
 * Define a new workflow with compile-time validation
 * ensuring that 'after' arrays can only reference tasks in the workflow.
 */
export function defineWorkflow<TTasks extends TaskName>(
  def: WorkflowDefinition<TTasks>,
): Workflow {
  // Convert to runtime structure
  const tasks = new Map<TaskName, Set<TaskName>>()
  for (const [taskName, step] of Object.entries(def.tasks)) {
    tasks.set(taskName as TaskName, new Set(step.after))
  }

  const workflow: Workflow = {
    name: def.name,
    tasks,
  }

  // Register workflow
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
 * Get entry tasks (no prerequisites)
 */
export function getEntryTasks(workflow: Workflow): Array<TaskName> {
  const entryTasks: Array<TaskName> = []

  for (const [taskName, prerequisites] of workflow.tasks) {
    if (prerequisites.size === 0) {
      entryTasks.push(taskName)
    }
  }

  return entryTasks
}

/**
 * Check if a task's prerequisites are satisfied
 */
export function arePrerequisitesSatisfied(
  workflow: Workflow,
  taskName: TaskName,
  completed: Set<TaskName>,
): boolean {
  const prerequisites = workflow.tasks.get(taskName)
  if (!prerequisites) return false

  for (const prereq of prerequisites) {
    if (!completed.has(prereq)) {
      return false
    }
  }

  return true
}

/**
 * Validate workflow DAG (no cycles, all references valid)
 */
export function validateWorkflow(workflow: Workflow): Array<string> {
  const errors: Array<string> = []
  const taskNames = new Set(workflow.tasks.keys())

  // Check that all prerequisites exist
  for (const [taskName, prerequisites] of workflow.tasks) {
    for (const prereq of prerequisites) {
      if (!taskNames.has(prereq)) {
        errors.push(
          `Task '${taskName}' has unknown prerequisite '${prereq}'`,
        )
      }
    }
  }

  // Check for cycles using DFS
  const visiting = new Set<TaskName>()
  const visited = new Set<TaskName>()

  function hasCycle(task: TaskName): boolean {
    if (visited.has(task)) return false
    if (visiting.has(task)) return true

    visiting.add(task)
    const prerequisites = workflow.tasks.get(task) ?? new Set()
    for (const prereq of prerequisites) {
      if (hasCycle(prereq)) return true
    }
    visiting.delete(task)
    visited.add(task)
    return false
  }

  for (const task of taskNames) {
    if (hasCycle(task)) {
      errors.push(`Workflow '${workflow.name}' contains a cycle`)
      break
    }
  }

  return errors
}
