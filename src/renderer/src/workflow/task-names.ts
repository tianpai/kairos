/**
 * Task Name Constants
 *
 * Isolated file for task names that can be safely imported in Web Workers.
 * Do NOT add imports from files that use `window` or DOM APIs.
 */

export const RESUME_PARSING = 'resume.parsing' as const
export const RESUME_TAILORING = 'resume.tailoring' as const
export const CHECKLIST_PARSING = 'checklist.parsing' as const
export const CHECKLIST_MATCHING = 'checklist.matching' as const
export const SCORE_UPDATING = 'score.updating' as const
export const JOBINFO_EXTRACTING = 'jobinfo.extracting' as const
