import {
  RESUME_PARSING,
  RESUME_TAILORING,
  CHECKLIST_PARSING,
  CHECKLIST_MATCHING,
  SCORE_UPDATING,
} from './workflow.types'
import type { Workflow } from './workflow.types'

/**
 * CREATE_APPLICATION_WORKFLOW
 *
 * Entry tasks: resume.parsing, checklist.parsing (run in parallel)
 *
 * Flow:
 *   resume.parsing ---|
 *                      |---> checklist.matching ---> score.updating
 *   checklist.parsing |
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
 */
export const CHECKLIST_ONLY_WORKFLOW: Workflow = {
  [CHECKLIST_PARSING]: {
    prerequisites: [],
    triggers: [CHECKLIST_MATCHING],
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

export const WORKFLOWS: Record<'create-application' | 'tailoring' | 'checklist-only', Workflow> = {
  'create-application': CREATE_APPLICATION_WORKFLOW,
  tailoring: TAILORING_WORKFLOW,
  'checklist-only': CHECKLIST_ONLY_WORKFLOW,
}
