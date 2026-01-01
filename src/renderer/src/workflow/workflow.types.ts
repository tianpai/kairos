import type { Checklist } from '@type/checklist'

/**
 * Task Names: <resource>.<action>
 * - resource: the entity being operated on (resume, checklist, score)
 * - action: the operation being performed (parsing, tailoring, matching, updating)
 */

export const RESUME_PARSING = 'resume.parsing' as const
export const RESUME_TAILORING = 'resume.tailoring' as const
export const CHECKLIST_PARSING = 'checklist.parsing' as const
export const CHECKLIST_MATCHING = 'checklist.matching' as const
export const SCORE_UPDATING = 'score.updating' as const
export const JOBINFO_EXTRACTING = 'jobinfo.extracting' as const

export type Task =
  | typeof RESUME_PARSING
  | typeof RESUME_TAILORING
  | typeof CHECKLIST_PARSING
  | typeof CHECKLIST_MATCHING
  | typeof SCORE_UPDATING
  | typeof JOBINFO_EXTRACTING

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'
export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed'
export type WorkflowName = 'create-application' | 'tailoring' | 'checklist-only'

/** Tracks which tasks are pending/running/completed/failed */
export type TaskStateMap = Partial<Record<Task, TaskStatus>>

/**
 * Task dependencies - defines what comes before and after
 */
export interface TaskDep {
  prerequisites: Array<Task>
  triggers: Array<Task>
}

/**
 * Workflow definition - DAG structure of task dependencies
 */
export type Workflow = Partial<Record<Task, TaskDep>>

/**
 * Workflow execution instance
 * - Tracks state of a workflow run for a specific job
 * - One workflow instance per jobId at a time
 */
export interface WorkflowInstance {
  jobId: string
  workflowName: WorkflowName
  taskStates: TaskStateMap
  status: WorkflowStatus
  error?: string
}

/**
 * Context for workflow execution - accumulates data from completed tasks
 */
export interface WorkflowContext {
  jobId: string
  rawResumeContent?: string
  jobDescription?: string
  templateId?: string
  resumeStructure?: Record<string, unknown>
  checklist?: Checklist
}
