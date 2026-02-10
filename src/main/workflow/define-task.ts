/**
 * Task Definition Factory
 *
 * Provides a type-safe way to define tasks. The factory:
 * 1. Infers all types from the task name (via TaskContracts)
 * 2. Validates inputKeys at compile time
 * 3. Auto-registers the task in the global registry
 */

import type {
  TaskInput,
  TaskName,
  TaskOutput,
  TaskProvides,
  ValidInputKeys,
  WorkflowContext,
} from "@type/task-contracts";

/**
 * Task configuration object
 */
export interface TaskConfig<T extends TaskName> {
  /** Task identifier - must match a key in TaskContracts */
  name: T;

  /** Enable streaming and partial events for AI tasks */
  streaming?: boolean;

  /**
   * Context keys required as input.
   * Must be keys that exist in both TaskInput<T> and WorkflowContext.
   */
  inputKeys: ValidInputKeys<T>;

  /**
   * Context key to write output to.
   * Must match the 'provides' field in TaskContracts for this task.
   * Omit if task doesn't write to context.
   */
  provides?: TaskProvides<T>;

  /** Execute the task */
  execute: (
    input: TaskInput<T>,
    meta: TaskExecutionMeta,
  ) => Promise<TaskOutput<T>>;

  /** Handle successful completion (persist to DB) */
  onSuccess: (jobId: string, result: TaskOutput<T>) => Promise<void>;
}

/**
 * Runtime task instance with metadata
 */
export interface Task<T extends TaskName = TaskName> {
  readonly name: T;
  readonly inputKeys: ValidInputKeys<T>;
  readonly provides?: string;
  readonly streaming?: boolean;
  execute: (
    input: TaskInput<T>,
    meta: TaskExecutionMeta,
  ) => Promise<TaskOutput<T>>;
  onSuccess: (jobId: string, result: TaskOutput<T>) => Promise<void>;
}

export interface TaskExecutionMeta {
  jobId: string;
  taskName: TaskName;
  emitPartial?: (partial: unknown) => void;
}

/**
 * Global task registry - populated by defineTask calls
 */
const taskRegistry = new Map<TaskName, Task>();

/**
 * Define a new task with full type inference
 */
export function defineTask<T extends TaskName>(config: TaskConfig<T>): Task<T> {
  const task: Task<T> = {
    name: config.name,
    inputKeys: config.inputKeys,
    provides: config.provides as string | undefined,
    streaming: config.streaming,
    execute: config.execute,
    onSuccess: config.onSuccess,
  };

  // Auto-register
  taskRegistry.set(config.name, task as Task);

  return task;
}

/**
 * Get a task by name (type-safe)
 */
export function getTask<T extends TaskName>(name: T): Task<T> | undefined {
  return taskRegistry.get(name) as Task<T> | undefined;
}

/**
 * Get all registered tasks
 */
export function getAllTasks(): ReadonlyMap<TaskName, Task> {
  return taskRegistry;
}

/**
 * Check if a task is registered
 */
export function hasTask(name: TaskName): boolean {
  return taskRegistry.has(name);
}

/**
 * Resolve task input from workflow context
 *
 * Returns the input object if all required keys are present, null otherwise.
 */
export function resolveTaskInput<T extends TaskName>(
  task: Task<T>,
  context: WorkflowContext,
): TaskInput<T> | null {
  const input: Record<string, unknown> = {};

  for (const key of task.inputKeys) {
    const value = context[key];
    if (value === undefined) {
      return null;
    }
    input[key as string] = value;
  }

  return input as TaskInput<T>;
}

/**
 * Get missing input keys for a task
 */
export function getMissingInputs<T extends TaskName>(
  task: Task<T>,
  context: WorkflowContext,
): Array<string> {
  const missing: Array<string> = [];

  for (const key of task.inputKeys) {
    if (context[key] === undefined) {
      missing.push(key as string);
    }
  }

  return missing;
}
