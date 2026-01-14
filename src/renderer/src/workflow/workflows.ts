import { defineWorkflow } from './define-workflow'

/**
 * Checklist Only Workflow
 *
 * For scratch builds where resume structure already exists:
 *
 *   checklist.parsing ──► checklist.matching ──► score.updating
 *
 *   jobinfo.extracting (independent, runs in parallel)
 */
export const checklistOnlyWorkflow = defineWorkflow({
  name: 'checklist-only',
  tasks: {
    'checklist.parsing': { after: [] },
    'jobinfo.extracting': { after: [] },
    'checklist.matching': { after: ['checklist.parsing'] },
    'score.updating': { after: ['checklist.matching'] },
  },
})

/**
 * Create Application Workflow
 *
 * Full workflow for creating a new job application:
 *
 *   resume.parsing ───┐
 *                     ├──► checklist.matching ──► score.updating
 *   checklist.parsing ┘
 *
 *   jobinfo.extracting (independent, runs in parallel)
 */
export const createApplicationWorkflow = defineWorkflow({
  name: 'create-application',
  tasks: {
    'resume.parsing': { after: [] },
    'checklist.parsing': { after: [] },
    'jobinfo.extracting': { after: [] },
    'checklist.matching': { after: ['resume.parsing', 'checklist.parsing'] },
    'score.updating': { after: ['checklist.matching'] },
  },
})

/**
 * Tailoring Workflow
 *
 * Tailor an existing resume based on checklist:
 *
 *   resume.tailoring ──► checklist.matching ──► score.updating
 *
 * Assumes checklist already exists from create-application workflow.
 */
export const tailoringWorkflow = defineWorkflow({
  name: 'tailoring',
  tasks: {
    'resume.tailoring': { after: [] },
    'checklist.matching': { after: ['resume.tailoring'] },
    'score.updating': { after: ['checklist.matching'] },
  },
})
