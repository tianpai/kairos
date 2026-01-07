/**
 * Checklist Only Workflow
 *
 * For scratch builds where resume structure already exists:
 *
 *   checklist.parsing ──► checklist.matching ──► score.updating
 *
 *   jobinfo.extracting (independent, runs in parallel)
 */

import { defineWorkflow } from '../define-workflow'

export const checklistOnlyWorkflow = defineWorkflow({
  name: 'checklist-only',
  tasks: {
    'checklist.parsing': { after: [] },
    'jobinfo.extracting': { after: [] },
    'checklist.matching': { after: ['checklist.parsing'] },
    'score.updating': { after: ['checklist.matching'] },
  },
})
