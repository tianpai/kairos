/**
 * Task Contracts
 *
 * Defines task names and domain types used across the workflow system.
 */

import type { Checklist } from "@type/checklist";

// Domain types
export type ResumeStructure = Record<string, unknown>;

export interface ExtractedJobInfo {
  company: string;
  position: string;
  dueDate: string | null;
}

/** All valid task names */
export type TaskName =
  | "resume.parsing"
  | "resume.tailoring"
  | "checklist.parsing"
  | "checklist.matching"
  | "score.updating"
  | "jobinfo.extracting";
