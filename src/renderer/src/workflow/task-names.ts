/**
 * Task Name Constants
 *
 * Isolated file for task names that can be safely imported in Web Workers.
 * Do NOT add imports from files that use `window` or DOM APIs.
 */

export {
  RESUME_PARSING,
  RESUME_TAILORING,
  CHECKLIST_PARSING,
  CHECKLIST_MATCHING,
  SCORE_UPDATING,
  JOBINFO_EXTRACTING,
} from '@type/task-names'
