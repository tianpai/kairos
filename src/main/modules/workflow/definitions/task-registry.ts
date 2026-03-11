/**
 * Task Registry
 *
 * Simple task definition and lookup. Tasks are self-contained:
 * they read from DB, run, and write to DB.
 */

import type { TaskName } from "@type/task-contracts";
import type { TaskDeps } from "../tasks/task-deps";

export interface TaskConfig {
  name: TaskName;
  streaming?: boolean;
  execute: (
    jobId: string,
    deps: TaskDeps,
    emitPartial?: (partial: unknown) => void,
  ) => Promise<void>;
}

const taskRegistry = new Map<TaskName, TaskConfig>();

export function defineTask(config: TaskConfig): void {
  taskRegistry.set(config.name, config);
}

export function getTask(name: TaskName): TaskConfig | undefined {
  return taskRegistry.get(name);
}

export function hasTask(name: TaskName): boolean {
  return taskRegistry.has(name);
}
