import log from 'electron-log/renderer'

import { saveWorkflow } from '@api/jobs'
import { tip } from '@tips/tips.service'

import { resumeParsingTask } from '../tasks/resume-parsing.task'
import { checklistParsingTask } from '../tasks/checklist-parsing.task'
import { resumeTailoringTask } from '../tasks/resume-tailoring.task'
import { checklistMatchingTask } from '../tasks/checklist-matching.task'
import { scoreUpdatingTask } from '../tasks/score-updating.task'
import { jobInfoExtractingTask } from '../tasks/jobinfo-extracting.task'

import { WORKFLOWS } from './workflow.constants'
import { useWorkflowStore } from './workflow.store'

import {
  CHECKLIST_MATCHING,
  CHECKLIST_PARSING,
  JOBINFO_EXTRACTING,
  RESUME_PARSING,
  RESUME_TAILORING,
  SCORE_UPDATING,
} from './workflow.types'
import type { WorkflowStepsData } from '@api/jobs'
import type { BaseTask } from '../tasks/base.task'
import type {
  Task,
  TaskStateMap,
  Workflow,
  WorkflowContext,
  WorkflowName,
} from './workflow.types'

/**
 * Task Registry - maps task names to task instances
 */
const TASK_REGISTRY: Record<Task, BaseTask<Task>> = {
  [RESUME_PARSING]: resumeParsingTask,
  [CHECKLIST_PARSING]: checklistParsingTask,
  [CHECKLIST_MATCHING]: checklistMatchingTask,
  [RESUME_TAILORING]: resumeTailoringTask,
  [SCORE_UPDATING]: scoreUpdatingTask,
  [JOBINFO_EXTRACTING]: jobInfoExtractingTask,
}

/**
 * Resolve task input from workflow context using task's inputKeys
 */
function resolveTaskInput(
  task: BaseTask<Task>,
  context: WorkflowContext,
): Record<string, unknown> | null {
  const input: Record<string, unknown> = {}

  for (const key of task.inputKeys) {
    const value = context[key]
    if (value === undefined) {
      return null // Missing required input
    }
    input[key] = value
  }

  return input
}

/**
 * Find entry tasks (tasks with no prerequisites)
 */
function findEntryTasks(workflow: Workflow): Array<Task> {
  return Object.entries(workflow)
    .filter(([, dep]) => dep.prerequisites.length === 0)
    .map(([task]) => task as Task)
}

/**
 * Find tasks ready to run (pending with all prerequisites completed and inputs available)
 */
function findReadyTasks(
  taskStates: TaskStateMap,
  workflow: Workflow,
  context: WorkflowContext,
): Array<Task> {
  const ready: Array<Task> = []

  for (const [taskName, taskDep] of Object.entries(workflow)) {
    const status = taskStates[taskName as Task]
    if (status !== 'pending') continue

    // Check all prerequisites completed
    const allPrereqsCompleted = taskDep.prerequisites.every(
      (prereq) => taskStates[prereq] === 'completed',
    )
    if (!allPrereqsCompleted) continue

    // Check all inputs available
    const task = TASK_REGISTRY[taskName as Task]
    const input = resolveTaskInput(task, context)
    if (input === null) {
      // Log which inputs are missing for debugging
      const missingKeys = task.inputKeys.filter(
        (key) => context[key as keyof WorkflowContext] === undefined,
      )
      log.debug(
        `[Workflow] Task ${taskName} blocked on missing inputs: ${missingKeys.join(', ')}`,
      )
      continue
    }

    ready.push(taskName as Task)
  }

  return ready
}

/**
 * Start a workflow
 */
export async function startWorkflow(
  workflowName: WorkflowName,
  jobId: string,
  initialData: Partial<WorkflowContext>,
): Promise<void> {
  log.info(`[Workflow] Starting ${workflowName} workflow for:`, jobId)

  const workflowDef = WORKFLOWS[workflowName]
  const tasks = Object.keys(workflowDef) as Array<Task>

  const store = useWorkflowStore.getState()
  store.startWorkflow(jobId, workflowName, tasks, initialData)

  const workflow = store.getWorkflow(jobId)!
  await saveWorkflow(jobId, workflow, workflow.status)

  // Find and start entry tasks
  const entryTasks = findEntryTasks(workflowDef)
  const context = store.getContext(jobId)

  if (!context) {
    log.error('[Workflow] Context not found after starting workflow')
    return
  }

  for (const taskName of entryTasks) {
    const task = TASK_REGISTRY[taskName]
    const input = resolveTaskInput(task, context)

    if (input !== null) {
      runTask(jobId, taskName, input)
    }
  }
}

/**
 * Run a task and handle completion
 */
async function runTask(
  jobId: string,
  taskName: Task,
  input: Record<string, unknown>,
): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)
  const task = TASK_REGISTRY[taskName]

  // Verify workflow exists and is running
  if (!workflow || workflow.status !== 'running') {
    log.warn(
      `[Workflow] Task ${taskName} skipped - workflow not running for job ${jobId}`,
    )
    return
  }

  store.setTaskStatus(jobId, taskName, 'running')

  try {
    // Safe cast: inputKeys is compile-time validated to match TaskTypeMap[T]['input']
    // and resolveTaskInput verified all keys are present at runtime
    const result = await task.execute(input as Parameters<typeof task.execute>[0])
    await task.onSuccess(jobId, result)

    if (task.contextKey) {
      store.updateContext(jobId, { [task.contextKey]: result })
    }
    if (task.tipEvent) {
      tip.trigger(task.tipEvent, task.getTipData?.(result))
    }

    store.setTaskStatus(jobId, taskName, 'completed')
    const updatedWorkflow = store.getWorkflow(jobId)!
    await saveWorkflow(jobId, updatedWorkflow, updatedWorkflow.status)
    await startReadyTasks(jobId)
  } catch (error) {
    await handleTaskFailure(
      jobId,
      taskName,
      error instanceof Error ? error.message : String(error),
    )
  }
}

/**
 * Handle task failure
 */
async function handleTaskFailure(
  jobId: string,
  taskName: Task,
  error: string,
): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)

  if (!workflow) {
    log.warn(
      `[Workflow] Task ${taskName} failure ignored - workflow not in store for job ${jobId}`,
    )
    return
  }

  log.error(`[Workflow] Task ${taskName} failed:`, error)

  store.setTaskStatus(jobId, taskName, 'failed', error)
  store.failWorkflow(jobId, error)

  const updatedWorkflow = store.getWorkflow(jobId)!
  await saveWorkflow(jobId, updatedWorkflow, updatedWorkflow.status)
}

/**
 * Find and start all ready tasks
 */
async function startReadyTasks(jobId: string): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)
  const context = store.getContext(jobId)

  if (!workflow || workflow.status !== 'running' || !context) {
    return
  }

  const workflowDef = WORKFLOWS[workflow.workflowName]
  const readyTasks = findReadyTasks(workflow.taskStates, workflowDef, context)

  if (readyTasks.length === 0) {
    // Check if all tasks completed
    const allCompleted = Object.values(workflow.taskStates).every(
      (s) => s === 'completed',
    )
    if (allCompleted) {
      store.completeWorkflow(jobId)
      const completedWorkflow = store.getWorkflow(jobId)!
      await saveWorkflow(jobId, completedWorkflow, completedWorkflow.status)
    }
    return
  }

  // Start ready tasks
  log.info(
    `[Workflow] Starting ${readyTasks.length} ready task(s): ${readyTasks.join(', ')}`,
  )
  for (const taskName of readyTasks) {
    const task = TASK_REGISTRY[taskName]
    const input = resolveTaskInput(task, context)

    if (input !== null) {
      runTask(jobId, taskName, input)
    }
  }
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

  // Reset failed tasks to pending and restart workflow
  store.loadWorkflow(jobId, {
    ...workflow,
    taskStates: {
      ...workflow.taskStates,
      ...Object.fromEntries(failedTasks.map((task) => [task, 'pending'])),
    },
    status: 'running',
    error: undefined,
  })

  const updatedWorkflow = store.getWorkflow(jobId)!
  await saveWorkflow(jobId, updatedWorkflow, updatedWorkflow.status)
  await startReadyTasks(jobId)

  return failedTasks
}

/**
 * Wait for a specific task to complete
 */
export function waitForTaskCompletion(
  jobId: string,
  taskName: Task,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const store = useWorkflowStore.getState()
    const workflow = store.getWorkflow(jobId)

    // Check if already completed
    if (workflow?.taskStates[taskName] === 'completed') {
      resolve()
      return
    }

    // Check if already failed
    if (workflow?.taskStates[taskName] === 'failed') {
      reject(new Error(`Task ${taskName} failed`))
      return
    }

    // Subscribe to changes
    const unsubscribe = useWorkflowStore.subscribe((state) => {
      const instance = state.workflows[jobId]
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!instance) return

      const taskState = instance.taskStates[taskName]
      if (taskState === 'completed') {
        unsubscribe()
        resolve()
      } else if (taskState === 'failed') {
        unsubscribe()
        reject(new Error(`Task ${taskName} failed`))
      }
    })
  })
}

/**
 * Detect and fix stale "running" states from interrupted workflows.
 * Called when loading workflow state from DB on app start/navigation.
 *
 * If the workflow was "running" in DB, it means the app was closed/crashed
 * mid-workflow. We mark it as "failed" so the user can retry later.
 */
export function recoverStaleWorkflow(workflowSteps: WorkflowStepsData): {
  recovered: WorkflowStepsData
  wasStale: boolean
} {
  if (workflowSteps.status !== 'running') {
    return { recovered: workflowSteps, wasStale: false }
  }

  // Workflow was "running" - mark as failed (interrupted)
  const recoveredTaskStates: Record<string, string> = {}

  for (const [task, status] of Object.entries(workflowSteps.taskStates)) {
    recoveredTaskStates[task] = status === 'running' ? 'failed' : status
  }

  return {
    recovered: {
      ...workflowSteps,
      status: 'failed',
      taskStates: recoveredTaskStates,
      error: 'Workflow was interrupted',
    },
    wasStale: true,
  }
}
