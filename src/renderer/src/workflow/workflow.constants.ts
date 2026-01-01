import {
  CHECKLIST_MATCHING,
  CHECKLIST_PARSING,
  JOBINFO_EXTRACTING,
  RESUME_PARSING,
  RESUME_TAILORING,
  SCORE_UPDATING,
} from './workflow.types'
import type { Workflow } from './workflow.types'

/**
 * CREATE_APPLICATION_WORKFLOW
 *
 * Entry tasks: resume.parsing, checklist.parsing, jobinfo.extracting (run in parallel)
 *
 * Flow:
 *   resume.parsing ---|
 *                      |---> checklist.matching ---> score.updating
 *   checklist.parsing |
 *
 *   jobinfo.extracting (independent - extracts company/position/dueDate from JD)
 */
export const CREATE_APPLICATION_WORKFLOW: Workflow = {
  [RESUME_PARSING]: {
    prerequisites: [],
    triggers: [CHECKLIST_MATCHING],
  },
  [CHECKLIST_PARSING]: {
    prerequisites: [],
    triggers: [CHECKLIST_MATCHING],
  },
  [JOBINFO_EXTRACTING]: {
    prerequisites: [],
    triggers: [], // Independent - updates DB directly, doesn't block other tasks
  },
  [CHECKLIST_MATCHING]: {
    prerequisites: [RESUME_PARSING, CHECKLIST_PARSING],
    triggers: [SCORE_UPDATING],
  },
  [SCORE_UPDATING]: {
    prerequisites: [CHECKLIST_MATCHING],
    triggers: [],
  },
}

/**
 * TAILORING_WORKFLOW
 *
 * Entry task: resume.tailoring
 * Flow: resume.tailoring -> checklist.matching -> score.updating
 *
 * Note: Assumes checklist already exists from CREATE_APPLICATION
 */
export const TAILORING_WORKFLOW: Workflow = {
  [RESUME_TAILORING]: {
    prerequisites: [],
    triggers: [CHECKLIST_MATCHING],
  },
  [CHECKLIST_MATCHING]: {
    prerequisites: [RESUME_TAILORING],
    triggers: [SCORE_UPDATING],
  },
  [SCORE_UPDATING]: {
    prerequisites: [CHECKLIST_MATCHING],
    triggers: [],
  },
}

/**
 * CHECKLIST_ONLY_WORKFLOW
 *
 * For scratch builds where resume is already structured (no parsing needed).
 * Entry task: checklist.parsing
 * Flow: checklist.parsing -> checklist.matching -> score.updating
 *
 * Note: jobinfo.extracting is optionally started if JD is provided (existing mode)
 */
export const CHECKLIST_ONLY_WORKFLOW: Workflow = {
  [CHECKLIST_PARSING]: {
    prerequisites: [],
    triggers: [CHECKLIST_MATCHING],
  },
  [JOBINFO_EXTRACTING]: {
    prerequisites: [],
    triggers: [], // Independent - updates DB directly, doesn't block other tasks
  },
  [CHECKLIST_MATCHING]: {
    prerequisites: [CHECKLIST_PARSING],
    triggers: [SCORE_UPDATING],
  },
  [SCORE_UPDATING]: {
    prerequisites: [CHECKLIST_MATCHING],
    triggers: [],
  },
}

export const WORKFLOWS: Record<
  'create-application' | 'tailoring' | 'checklist-only',
  Workflow
> = {
  'create-application': CREATE_APPLICATION_WORKFLOW,
  tailoring: TAILORING_WORKFLOW,
  'checklist-only': CHECKLIST_ONLY_WORKFLOW,
}
