import type { Checklist } from '@type/checklist'
import type { ExtractedJobInfo } from '../workers/prompts/jobinfo-extracting'
import {
  RESUME_PARSING,
  RESUME_TAILORING,
  CHECKLIST_PARSING,
  CHECKLIST_MATCHING,
  SCORE_UPDATING,
  JOBINFO_EXTRACTING,
} from '../workflow/workflow.types'
import type {
  Task,
  WorkflowContext,
  WorkflowContextKey,
} from '../workflow/workflow.types'

export type ResumeParsingInput = {
  rawResumeContent: string
  templateId: string
}
export type ResumeParsingOutput = Record<string, unknown>

export type ChecklistParsingInput = {
  jobDescription: string
}
export type ChecklistParsingOutput = Checklist

export type ChecklistMatchingInput = {
  checklist: Checklist
  resumeStructure: Record<string, unknown>
}
export type ChecklistMatchingOutput = Checklist

export type ResumeTailoringInput = {
  checklist: Checklist
  resumeStructure: Record<string, unknown>
  templateId: string
}
export type ResumeTailoringOutput = Record<string, unknown>

export type ScoreUpdatingInput = {
  jobId: string
}
export type ScoreUpdatingOutput = number

export type JobInfoExtractingInput = {
  jobDescription: string
}
export type JobInfoExtractingOutput = ExtractedJobInfo

export type TaskTypeMap = {
  [RESUME_PARSING]: { input: ResumeParsingInput; output: ResumeParsingOutput }
  [CHECKLIST_PARSING]: {
    input: ChecklistParsingInput
    output: ChecklistParsingOutput
  }
  [CHECKLIST_MATCHING]: {
    input: ChecklistMatchingInput
    output: ChecklistMatchingOutput
  }
  [RESUME_TAILORING]: {
    input: ResumeTailoringInput
    output: ResumeTailoringOutput
  }
  [SCORE_UPDATING]: { input: ScoreUpdatingInput; output: ScoreUpdatingOutput }
  [JOBINFO_EXTRACTING]: {
    input: JobInfoExtractingInput
    output: JobInfoExtractingOutput
  }
}

// Re-export Task type for convenience (single source of truth is workflow.types.ts)
export type { Task }

/**
 * Abstract base class for all workflow tasks.
 *
 * @template T - The task name, used to infer input/output types from TaskTypeMap
 */
export abstract class BaseTask<T extends Task> {
  /**
   * The task identifier (e.g., 'resume.parsing', 'checklist.matching')
   */
  abstract readonly name: T

  /**
   * Context keys required as input for this task.
   * The workflow engine uses this to auto-resolve inputs from context.
   */
  abstract readonly inputKeys: ReadonlyArray<WorkflowContextKey>

  /**
   * Optional: which workflow context key to update with the result
   */
  readonly contextKey?: WorkflowContextKey

  /**
   * Optional: tip event to trigger after success
   */
  readonly tipEvent?: string

  /**
   * Optional: get data to pass to tip.trigger()
   * Override in subclass if tip needs additional data
   */
  getTipData?(result: TaskTypeMap[T]['output']): Record<string, unknown>

  /**
   * Execute the task with the given input.
   * This typically calls an AI worker or performs local computation.
   */
  abstract execute(
    input: TaskTypeMap[T]['input'],
  ): Promise<TaskTypeMap[T]['output']>

  /**
   * Handle successful task completion.
   * This typically persists the result to the database.
   */
  abstract onSuccess(
    jobId: string,
    result: TaskTypeMap[T]['output'],
  ): Promise<void>
}
