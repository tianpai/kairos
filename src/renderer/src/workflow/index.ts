/**
 * Workflow - Main Entry Point
 *
 * Import this file to bootstrap the workflow system.
 * All tasks and workflows are auto-registered on import.
 *
 * Usage:
 * ```typescript
 * import { startWorkflow, waitForTask } from './workflow'
 *
 * await startWorkflow('create-application', jobId, {
 *   rawResumeContent: '...',
 *   jobDescription: '...',
 *   templateId: 'default',
 * })
 *
 * await waitForTask(jobId, 'score.updating')
 * ```
 */

// =============================================================================
// Register all tasks (order doesn't matter, they self-register)
// =============================================================================

// Import each task file - the defineTask() call registers it
import './tasks/score-updating.task'
import './tasks/checklist-matching.task'
import './tasks/resume-parsing.task'
import './tasks/resume-tailoring.task'
import './tasks/checklist-parsing.task'
import './tasks/jobinfo-extracting.task'

// =============================================================================
// Register all workflows (order doesn't matter, they self-register)
// =============================================================================

import './workflows'

// =============================================================================
// Public API Re-exports
// =============================================================================

// Types
export type {
  TaskName,
  TaskInput,
  TaskOutput,
  WorkflowContext,
} from './task-contracts'

// Task name constants (re-exported from isolated file for worker compatibility)
export {
  RESUME_PARSING,
  RESUME_TAILORING,
  CHECKLIST_PARSING,
  CHECKLIST_MATCHING,
  SCORE_UPDATING,
  JOBINFO_EXTRACTING,
} from './task-names'

// Task utilities
export { getTask, getAllTasks, hasTask } from './define-task'

// Workflow utilities
export {
  getWorkflow,
  getAllWorkflows,
  getEntryTasks,
  validateWorkflow,
} from './define-workflow'

// Store
export { useWorkflowStore } from './workflow.store'
export type {
  TaskStatus,
  WorkflowStatus,
  WorkflowInstance,
  TaskStateMap,
} from './workflow.store'

// Engine
export {
  startWorkflow,
  retryFailedTasks,
  waitForTask,
  recoverStaleWorkflow,
} from './workflow-engine'
