import type { Checklist } from '@type/checklist'
import type { ExtractedJobInfo } from '../workers/prompts/jobinfo-extracting'
import type { WorkflowContext } from '../workflow/workflow.types'

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
  'resume.parsing': { input: ResumeParsingInput; output: ResumeParsingOutput }
  'checklist.parsing': {
    input: ChecklistParsingInput
    output: ChecklistParsingOutput
  }
  'checklist.matching': {
    input: ChecklistMatchingInput
    output: ChecklistMatchingOutput
  }
  'resume.tailoring': {
    input: ResumeTailoringInput
    output: ResumeTailoringOutput
  }
  'score.updating': { input: ScoreUpdatingInput; output: ScoreUpdatingOutput }
  'jobinfo.extracting': {
    input: JobInfoExtractingInput
    output: JobInfoExtractingOutput
  }
}

export type TaskName = keyof TaskTypeMap

/**
 * Abstract base class for all workflow tasks.
 *
 * @template T - The task name, used to infer input/output types from TaskTypeMap
 */
export abstract class Task<T extends TaskName> {
  /**
   * The task identifier (e.g., 'resume.parsing', 'checklist.matching')
   */
  abstract readonly name: T

  /**
   * Optional: which workflow context key to update with the result
   */
  readonly contextKey?: keyof WorkflowContext

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
