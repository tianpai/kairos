import { useWorkflowStore } from './workflow.store'
import { WORKFLOWS } from './workflow.constants'
import {
  RESUME_PARSING,
  RESUME_TAILORING,
  CHECKLIST_PARSING,
  CHECKLIST_MATCHING,
  SCORE_UPDATING,
} from './workflow.types'
import type { Task, Workflow, WorkflowName, TaskStateMap } from './workflow.types'
import type { Checklist } from '@type/checklist'
import { saveWorkflowState as saveWorkflowStateToDb } from '@api/jobs'

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
  const workflowName: WorkflowName = 'create-application'
  const workflow = WORKFLOWS[workflowName]
  const tasks = Object.keys(workflow) as Task[]

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
  const tasks = Object.keys(workflow) as Task[]

  const store = useWorkflowStore.getState()
  store.startWorkflow(jobId, workflowName, tasks, {
    checklist: data.checklist,
    resumeStructure: data.resumeStructure,
    jsonSchema: data.jsonSchema,
  })

  await saveWorkflowState(jobId)

  // Start entry task
  runTask(jobId, RESUME_TAILORING, () =>
    executeResumeTailoring(data.checklist, data.resumeStructure, data.jsonSchema),
  )
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

  // Verify this task belongs to the active workflow
  if (store.activeWorkflow?.jobId !== jobId) {
    console.warn(`[Workflow] Task ${taskType} skipped - workflow changed`)
    return
  }

  store.setTaskStatus(taskType, 'running')

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
  const context = store.context

  if (!context || store.activeWorkflow?.jobId !== jobId) {
    console.warn(`[Workflow] Task ${taskType} success ignored - workflow changed`)
    return
  }

  // Call task-specific success handler (persists to DB)
  // and update context with result for downstream tasks
  switch (taskType) {
    case RESUME_PARSING: {
      const resumeStructure = result as Record<string, unknown>
      await onResumeParsingSuccess(jobId, resumeStructure)
      store.updateContext({ resumeStructure })
      break
    }
    case CHECKLIST_PARSING: {
      const checklist = result as Checklist
      await onChecklistParsingSuccess(jobId, checklist)
      store.updateContext({ checklist })
      break
    }
    case RESUME_TAILORING: {
      const tailoredResume = result as Record<string, unknown>
      await onResumeTailoringSuccess(jobId, tailoredResume)
      store.updateContext({ resumeStructure: tailoredResume })
      break
    }
    case CHECKLIST_MATCHING: {
      const matchedChecklist = result as Checklist
      await onChecklistMatchingSuccess(jobId, matchedChecklist)
      store.updateContext({ checklist: matchedChecklist })
      break
    }
    case SCORE_UPDATING: {
      const matchPercentage = result as number
      await onScoreUpdatingSuccess(jobId, matchPercentage)
      break
    }
  }

  // Update task state to completed
  store.setTaskStatus(taskType, 'completed')
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

  if (store.activeWorkflow?.jobId !== jobId) {
    console.warn(`[Workflow] Task ${taskType} failure ignored - workflow changed`)
    return
  }

  console.error(`[Workflow] Task ${taskType} failed:`, error)

  store.setTaskStatus(taskType, 'failed', error)
  store.failWorkflow(error)

  await saveWorkflowState(jobId)
}

/**
 * Find tasks with all prerequisites completed and start them
 */
async function startReadyTasks(jobId: string): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.activeWorkflow
  const context = store.context

  if (!workflow || workflow.status !== 'running' || workflow.jobId !== jobId) {
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
      store.completeWorkflow()
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
            executeChecklistMatching(context.checklist!, context.resumeStructure!),
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
function findReadyTasks(taskStates: TaskStateMap, workflow: Workflow): Task[] {
  const ready: Task[] = []

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
  const workflow = store.activeWorkflow

  if (!workflow || workflow.jobId !== jobId) return

  await saveWorkflowStateToDb(jobId, workflow, workflow.status)
}

/**
 * Retry failed tasks for a job
 */
export async function retryFailedTasks(jobId: string): Promise<Task[]> {
  const store = useWorkflowStore.getState()
  const workflow = store.activeWorkflow

  if (!workflow || workflow.jobId !== jobId) {
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
  failedTasks.forEach((task) => store.setTaskStatus(task, 'pending'))

  // Reset workflow status to running
  store.activeWorkflow!.status = 'running'
  store.activeWorkflow!.error = undefined

  await saveWorkflowState(jobId)

  // Start ready tasks (which may include the reset tasks)
  await startReadyTasks(jobId)

  return failedTasks
}

/**
 * Load workflow state from database and resume if needed
 */
export function loadWorkflowFromJob(
  jobId: string,
  job: {
    workflowSteps?: {
      workflowName: WorkflowName
      taskStates: TaskStateMap
      status: string
    }
    rawResumeContent?: string
    jobDescription?: string
    jsonSchema?: Record<string, unknown>
    parsedResume?: Record<string, unknown>
    tailoredResume?: Record<string, unknown>
    checklist?: Checklist
  },
): void {
  if (!job.workflowSteps) return

  const store = useWorkflowStore.getState()

  // Reconstruct workflow instance
  store.startWorkflow(
    jobId,
    job.workflowSteps.workflowName,
    Object.keys(job.workflowSteps.taskStates) as Task[],
    {
      rawResumeContent: job.rawResumeContent,
      jobDescription: job.jobDescription,
      jsonSchema: job.jsonSchema,
      resumeStructure: job.tailoredResume ?? job.parsedResume,
      checklist: job.checklist,
    },
  )

  // Restore task states
  for (const [task, status] of Object.entries(job.workflowSteps.taskStates)) {
    store.setTaskStatus(task as Task, status as 'pending' | 'running' | 'completed' | 'failed')
  }

  // Restore workflow status
  if (job.workflowSteps.status === 'failed') {
    store.failWorkflow('Workflow was previously failed')
  } else if (job.workflowSteps.status === 'completed') {
    store.completeWorkflow()
  }
}
