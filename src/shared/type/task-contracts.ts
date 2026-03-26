/**
 * Task Contracts
 *
 * Domain types used by workflow tasks.
 */

export type ResumeStructure = Record<string, unknown>;

export interface ExtractedJobInfo {
  company: string;
  position: string;
  dueDate: string | null;
}
