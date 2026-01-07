/**
 * Tailoring Workflow
 *
 * Tailor an existing resume based on checklist:
 *
 *   resume.tailoring ──► checklist.matching ──► score.updating
 *
 * Assumes checklist already exists from create-application workflow.
 */

import { defineWorkflow } from '../define-workflow'

export const tailoringWorkflow = defineWorkflow({
  name: 'tailoring',
  tasks: {
    'resume.tailoring': { after: [] },
    'checklist.matching': { after: ['resume.tailoring'] },
    'score.updating': { after: ['checklist.matching'] },
  },
})
