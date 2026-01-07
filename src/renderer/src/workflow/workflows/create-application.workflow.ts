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

import { defineWorkflow } from '../define-workflow'

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
