/**
 * Task Contracts - The Single Source of Truth
 *
 * All type information for the workflow system flows from this file.
 * To add a new task:
 * 1. Add its contract here
 * 2. Create the task file (it will be fully typed automatically)
 *
 * The 'provides' field determines what context key the task writes to.
 * The 'input' keys must exist in WorkflowContext (enforced by types).
 */

import type { Checklist } from "@type/checklist";

// Domain types
export type ResumeStructure = Record<string, unknown>;

export interface ExtractedJobInfo {
  company: string;
  position: string;
  dueDate: string | null;
}

/**
 * Task Contracts Registry
 *
 * Each task declares:
 * - input: what it needs to execute (keys must exist in context)
 * - output: what it produces
 * - provides: which context key to write the output to (optional)
 */
export interface TaskContracts {
  "resume.parsing": {
    input: { rawResumeContent: string; templateId: string };
    output: ResumeStructure;
    provides: "resumeStructure";
  };
  "resume.tailoring": {
    input: {
      checklist: Checklist;
      resumeStructure: ResumeStructure;
      templateId: string;
    };
    output: ResumeStructure;
    provides: "resumeStructure";
  };
  "checklist.parsing": {
    input: { jobDescription: string };
    output: Checklist;
    provides: "checklist";
  };
  "checklist.matching": {
    input: { checklist: Checklist; resumeStructure: ResumeStructure };
    output: Checklist;
    provides: "checklist";
  };
  "score.updating": {
    input: { checklist: Checklist };
    output: number;
    provides: never; // Doesn't write to context, saves directly to DB
  };
  "jobinfo.extracting": {
    input: { jobDescription: string };
    output: ExtractedJobInfo;
    provides: never; // Doesn't write to context, saves directly to DB
  };
}

// =============================================================================
// Derived Types - Do not edit manually, these are computed from TaskContracts
// =============================================================================

/** All valid task names */
export type TaskName = keyof TaskContracts;

/** Get input type for a task */
export type TaskInput<T extends TaskName> = TaskContracts[T]["input"];

/** Get output type for a task */
export type TaskOutput<T extends TaskName> = TaskContracts[T]["output"];

/** Get the context key a task provides (or never if it doesn't provide) */
export type TaskProvides<T extends TaskName> = TaskContracts[T]["provides"];

/** All context keys that tasks can provide */
export type ContextKey = {
  [T in TaskName]: TaskProvides<T>;
}[TaskName];

/**
 * WorkflowContext - Automatically derived from task contracts
 *
 * This replaces the manually maintained WorkflowContext interface.
 * Each key comes from a task's 'provides' field, typed to that task's output.
 */
export type WorkflowContext = {
  // Core identifier
  jobId: string;
} & {
  // Initial data (provided when starting workflow, not produced by tasks)
  rawResumeContent?: string;
  jobDescription?: string;
  templateId?: string;
} & {
  // Task-produced data (derived from contracts)
  [K in TaskName as TaskContracts[K]["provides"] extends string
    ? TaskContracts[K]["provides"]
    : never]?: TaskContracts[K]["output"];
};

/**
 * Validate that a task's input keys exist in WorkflowContext
 * This ensures tasks can only require data that exists in the context.
 */
export type ValidInputKeys<T extends TaskName> = ReadonlyArray<
  keyof TaskInput<T> & keyof WorkflowContext
>;

/**
 * Get the context keys required by a task
 */
export type RequiredContextKeys<T extends TaskName> = keyof TaskInput<T> &
  keyof WorkflowContext;
