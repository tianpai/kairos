import { saveWorkflowState as saveWorkflowStateToDb } from '@api/jobs'
import { tip } from '@tips/tips.service'

import {
  executeResumeParsing,
  onResumeParsingSuccess,
} from '../tasks/resume-parsing.task'
import {
  executeChecklistParsing,
  onChecklistParsingSuccess,
} from '../tasks/checklist-parsing.task'
import {
  executeResumeTailoring,
  onResumeTailoringSuccess,
} from '../tasks/resume-tailoring.task'
import {
  executeChecklistMatching,
  onChecklistMatchingSuccess,
} from '../tasks/checklist-matching.task'
import {
  executeScoreUpdating,
  onScoreUpdatingSuccess,
} from '../tasks/score-updating.task'
import {
  executeJobInfoExtraction,
  onJobInfoExtractionSuccess,
} from '../tasks/jobinfo-extracting.task'
import {
  CHECKLIST_MATCHING,
  CHECKLIST_PARSING,
  JOBINFO_EXTRACTING,
  RESUME_PARSING,
  RESUME_TAILORING,
  SCORE_UPDATING,
} from './workflow.types'
import { WORKFLOWS } from './workflow.constants'
import { useWorkflowStore } from './workflow.store'
import type { Checklist } from '@type/checklist'
import type {
  Task,
  TaskStateMap,
  Workflow,
  WorkflowName,
} from './workflow.types'

/**
 * Start CREATE_APPLICATION workflow
 *
 * Entry tasks: resume.parsing and checklist.parsing run in parallel
 */
export async function startCreateApplicationWorkflow(
  jobId: string,
  data: {
    rawResumeContent: string
    jobDescription: string
    jsonSchema: Record<string, unknown>
  },
): Promise<void> {
  console.log('[Workflow] Starting create-application workflow for job:', jobId)
  const workflowName: WorkflowName = 'create-application'
  const workflow = WORKFLOWS[workflowName]
  const tasks = Object.keys(workflow) as Array<Task>

  const store = useWorkflowStore.getState()
  store.startWorkflow(jobId, workflowName, tasks, {
    rawResumeContent: data.rawResumeContent,
    jobDescription: data.jobDescription,
    jsonSchema: data.jsonSchema,
  })

  await saveWorkflowState(jobId)

  // Start entry tasks in parallel (don't await - fire and forget)
  runTask(jobId, RESUME_PARSING, () =>
    executeResumeParsing(data.rawResumeContent, data.jsonSchema),
  )
  runTask(jobId, CHECKLIST_PARSING, () =>
    executeChecklistParsing(data.jobDescription),
  )
  runTask(jobId, JOBINFO_EXTRACTING, () =>
    executeJobInfoExtraction(data.jobDescription),
  )
}

/**
 * Start TAILORING workflow
 *
 * Entry task: resume.tailoring
 */
export async function startTailoringWorkflow(
  jobId: string,
  data: {
    checklist: Checklist
    resumeStructure: Record<string, unknown>
    jsonSchema: Record<string, unknown>
  },
): Promise<void> {
  const workflowName: WorkflowName = 'tailoring'
  const workflow = WORKFLOWS[workflowName]
  const tasks = Object.keys(workflow) as Array<Task>

  const store = useWorkflowStore.getState()
  store.startWorkflow(jobId, workflowName, tasks, {
    checklist: data.checklist,
    resumeStructure: data.resumeStructure,
    jsonSchema: data.jsonSchema,
  })

  await saveWorkflowState(jobId)

  // Start entry task
  runTask(jobId, RESUME_TAILORING, () =>
    executeResumeTailoring(
      data.checklist,
      data.resumeStructure,
      data.jsonSchema,
    ),
  )
}

/**
 * Start CHECKLIST_ONLY workflow
 *
 * For scratch builds where resume is already structured.
 * Entry task: checklist.parsing
 */
export async function startChecklistOnlyWorkflow(
  jobId: string,
  data: {
    jobDescription: string
    resumeStructure: Record<string, unknown>
    jsonSchema: Record<string, unknown>
  },
): Promise<void> {
  const workflowName: WorkflowName = 'checklist-only'
  const workflow = WORKFLOWS[workflowName]
  const tasks = Object.keys(workflow) as Array<Task>

  const store = useWorkflowStore.getState()
  store.startWorkflow(jobId, workflowName, tasks, {
    jobDescription: data.jobDescription,
    resumeStructure: data.resumeStructure,
    jsonSchema: data.jsonSchema,
  })

  await saveWorkflowState(jobId)

  // Start entry task
  runTask(jobId, CHECKLIST_PARSING, () =>
    executeChecklistParsing(data.jobDescription),
  )

  // Start job info extraction if JD is provided (existing mode, not scratch)
  if (data.jobDescription) {
    runTask(jobId, JOBINFO_EXTRACTING, () =>
      executeJobInfoExtraction(data.jobDescription),
    )
  }
}

/**
 * Run a task and handle completion
 */
async function runTask(
  jobId: string,
  taskType: Task,
  executor: () => Promise<unknown>,
): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)

  // Verify workflow exists and is running
  if (!workflow || workflow.status !== 'running') {
    console.warn(
      `[Workflow] Task ${taskType} skipped - workflow not running for job ${jobId}`,
    )
    return
  }

  store.setTaskStatus(jobId, taskType, 'running')

  try {
    const result = await executor()
    await handleTaskSuccess(jobId, taskType, result)
  } catch (error) {
    await handleTaskFailure(
      jobId,
      taskType,
      error instanceof Error ? error.message : String(error),
    )
  }
}

/**
 * Handle successful task completion
 */
async function handleTaskSuccess(
  jobId: string,
  taskType: Task,
  result: unknown,
): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)

  // Always persist task results to database (prevents data loss on navigation)
  switch (taskType) {
    case RESUME_PARSING: {
      const resumeStructure = result as Record<string, unknown>
      await onResumeParsingSuccess(jobId, resumeStructure)
      if (workflow) store.updateContext(jobId, { resumeStructure })
      break
    }
    case CHECKLIST_PARSING: {
      const checklist = result as Checklist
      await onChecklistParsingSuccess(jobId, checklist)
      if (workflow) {
        store.updateContext(jobId, { checklist })
        tip.trigger('checklist.parsed')
      }
      break
    }
    case RESUME_TAILORING: {
      const tailoredResume = result as Record<string, unknown>
      await onResumeTailoringSuccess(jobId, tailoredResume)
      if (workflow) {
        store.updateContext(jobId, { resumeStructure: tailoredResume })
        tip.trigger('tailoring.complete')
      }
      break
    }
    case CHECKLIST_MATCHING: {
      const matchedChecklist = result as Checklist
      await onChecklistMatchingSuccess(jobId, matchedChecklist)
      if (workflow) store.updateContext(jobId, { checklist: matchedChecklist })
      break
    }
    case SCORE_UPDATING: {
      const matchPercentage = result as number
      await onScoreUpdatingSuccess(jobId, matchPercentage)
      if (workflow) tip.trigger('score.updated', { score: matchPercentage })
      break
    }
    case JOBINFO_EXTRACTING: {
      const extractedJobInfo = result as Parameters<
        typeof onJobInfoExtractionSuccess
      >[1]
      await onJobInfoExtractionSuccess(jobId, extractedJobInfo)
      break
    }
  }

  // Only update workflow state and trigger downstream tasks if workflow exists
  if (!workflow) {
    console.log(
      `[Workflow] Task ${taskType} saved to DB, but workflow not in store - skipping state update`,
    )
    return
  }

  // Update task state to completed
  store.setTaskStatus(jobId, taskType, 'completed')
  await saveWorkflowState(jobId)

  // Find and start ready tasks
  await startReadyTasks(jobId)
}

/**
 * Handle task failure
 */
async function handleTaskFailure(
  jobId: string,
  taskType: Task,
  error: string,
): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)

  if (!workflow) {
    console.warn(
      `[Workflow] Task ${taskType} failure ignored - workflow not in store for job ${jobId}`,
    )
    return
  }

  console.error(`[Workflow] Task ${taskType} failed:`, error)

  store.setTaskStatus(jobId, taskType, 'failed', error)
  store.failWorkflow(jobId, error)

  await saveWorkflowState(jobId)
}

/**
 * Find tasks with all prerequisites completed and start them
 */
async function startReadyTasks(jobId: string): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)
  const context = store.getContext(jobId)

  if (!workflow || workflow.status !== 'running') {
    return
  }

  const workflowDef = WORKFLOWS[workflow.workflowName]
  if (!context) return

  const readyTasks = findReadyTasks(workflow.taskStates, workflowDef)

  if (readyTasks.length === 0) {
    // Check if all tasks completed
    const allCompleted = Object.values(workflow.taskStates).every(
      (s) => s === 'completed',
    )
    if (allCompleted) {
      store.completeWorkflow(jobId)
      await saveWorkflowState(jobId)
    }
    return
  }

  // Start ready tasks
  for (const taskType of readyTasks) {
    switch (taskType) {
      case CHECKLIST_MATCHING:
        if (context.checklist && context.resumeStructure) {
          runTask(jobId, CHECKLIST_MATCHING, () =>
            executeChecklistMatching(
              context.checklist!,
              context.resumeStructure!,
            ),
          )
        }
        break
      case SCORE_UPDATING:
        runTask(jobId, SCORE_UPDATING, () => executeScoreUpdating(jobId))
        break
    }
  }
}

/**
 * Find tasks ready to run (pending with all prerequisites completed)
 */
function findReadyTasks(
  taskStates: TaskStateMap,
  workflow: Workflow,
): Array<Task> {
  const ready: Array<Task> = []

  for (const [taskType, taskDep] of Object.entries(workflow)) {
    const status = taskStates[taskType as Task]
    if (status !== 'pending') continue

    const allPrereqsCompleted = taskDep.prerequisites.every(
      (prereq) => taskStates[prereq] === 'completed',
    )

    if (allPrereqsCompleted) {
      ready.push(taskType as Task)
    }
  }

  return ready
}

/**
 * Persist workflow state to database
 */
async function saveWorkflowState(jobId: string): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)

  if (!workflow) return

  await saveWorkflowStateToDb(jobId, workflow, workflow.status)
}

/**
 * Retry failed tasks for a job
 */
export async function retryFailedTasks(jobId: string): Promise<Array<Task>> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)

  if (!workflow) {
    throw new Error('No workflow found for job')
  }

  if (workflow.status !== 'failed') {
    throw new Error('Workflow is not in failed state')
  }

  // Find failed tasks
  const failedTasks = Object.entries(workflow.taskStates)
    .filter(([, status]) => status === 'failed')
    .map(([task]) => task as Task)

  if (failedTasks.length === 0) return []

  // Reset failed tasks to pending
  failedTasks.forEach((task) => store.setTaskStatus(jobId, task, 'pending'))

  // Reset workflow status to running (need to update directly since we don't have a setter)
  // We'll use loadWorkflow to reset the status
  store.loadWorkflow(jobId, {
    ...workflow,
    taskStates: {
      ...workflow.taskStates,
      ...Object.fromEntries(failedTasks.map((task) => [task, 'pending'])),
    },
    status: 'running',
    error: undefined,
  })

  await saveWorkflowState(jobId)

  // Start ready tasks (which may include the reset tasks)
  await startReadyTasks(jobId)

  return failedTasks
}
