/**
 * Workflow Engine
 *
 * Executes workflows using the task and workflow registries.
 * Responsibilities:
 * - Start workflows with initial context
 * - Run tasks when prerequisites are satisfied
 * - Update context with task outputs
 * - Handle failures and retries
 * - Persist workflow state to DB
 */

import log from 'electron-log/renderer'
import { tip } from '@tips/tips.service'
import { saveWorkflow } from '@api/jobs'

import { getMissingInputs, getTask, resolveTaskInput } from './define-task'
import {
  arePrerequisitesSatisfied,
  getEntryTasks,
  getWorkflow,
} from './define-workflow'
import { useWorkflowStore } from './workflow.store'
import type { Task } from './define-task'
import type { Workflow } from './define-workflow'
import type { TaskName, WorkflowContext } from './task-contracts'
import type { TaskStateMap, WorkflowInstance } from './workflow.store'
import type { WorkflowStepsData } from '@api/jobs'

// =============================================================================
// Public API
// =============================================================================

/**
 * Start a workflow for a job
 */
export async function startWorkflow(
  workflowName: string,
  jobId: string,
  initialContext: Partial<WorkflowContext>,
): Promise<void> {
  log.info(`[WorkflowEngine] Starting '${workflowName}' for job ${jobId}`)

  const workflow = getWorkflow(workflowName)
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowName}`)
  }

  // Validate all tasks in workflow are registered
  for (const taskName of workflow.tasks.keys()) {
    if (!getTask(taskName)) {
      throw new Error(
        `Workflow '${workflowName}' references unregistered task: ${taskName}`,
      )
    }
  }

  // Get task names array
  const tasks = Array.from(workflow.tasks.keys())

  // Initialize workflow in store
  const store = useWorkflowStore.getState()
  store.initWorkflow(jobId, workflowName, tasks, initialContext)

  // Persist initial state
  const workflowInstance = store.getWorkflow(jobId)!
  await persistWorkflow(jobId, workflowInstance)

  // Start entry tasks
  const entryTasks = getEntryTasks(workflow)
  log.info(`[WorkflowEngine] Entry tasks: ${entryTasks.join(', ')}`)

  for (const taskName of entryTasks) {
    void runTaskIfReady(workflow, jobId, taskName)
  }
}

/**
 * Retry failed tasks in a workflow
 */
export async function retryFailedTasks(
  jobId: string,
): Promise<Array<TaskName>> {
  const store = useWorkflowStore.getState()
  const workflowInstance = store.getWorkflow(jobId)

  if (!workflowInstance) {
    throw new Error(`No workflow instance for job ${jobId}`)
  }

  if (workflowInstance.status !== 'failed') {
    throw new Error('Can only retry failed workflows')
  }

  const workflow = getWorkflow(workflowInstance.workflowName)
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowInstance.workflowName}`)
  }

  // Find failed tasks
  const failedTasks: Array<TaskName> = []
  const resetTaskStates: TaskStateMap = { ...workflowInstance.taskStates }

  for (const [taskName, status] of Object.entries(
    workflowInstance.taskStates,
  )) {
    if (status === 'failed') {
      failedTasks.push(taskName as TaskName)
      resetTaskStates[taskName as TaskName] = 'pending'
    }
  }

  // Reset workflow state
  store.loadWorkflow(jobId, {
    ...workflowInstance,
    taskStates: resetTaskStates,
    status: 'running',
    error: undefined,
  })

  // Persist and restart
  const updatedWorkflow = store.getWorkflow(jobId)!
  await persistWorkflow(jobId, updatedWorkflow)
  await startReadyTasks(workflow, jobId)

  return failedTasks
}

/**
 * Wait for a specific task to complete
 */
export function waitForTask(jobId: string, taskName: TaskName): Promise<void> {
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
      if (!instance) return

      const taskStatus = instance.taskStates[taskName]
      if (taskStatus === 'completed') {
        unsubscribe()
        resolve()
      } else if (taskStatus === 'failed') {
        unsubscribe()
        reject(new Error(`Task ${taskName} failed`))
      }
    })
  })
}

/**
 * Detect and fix stale "running" states from interrupted workflows.
 * Called when loading workflow state from DB on app start/navigation.
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

// =============================================================================
// Internal Functions
// =============================================================================

/**
 * Persist workflow state to DB
 */
async function persistWorkflow(
  jobId: string,
  workflow: WorkflowInstance,
): Promise<void> {
  try {
    await saveWorkflow(
      jobId,
      {
        workflowName: workflow.workflowName,
        taskStates: workflow.taskStates as Record<string, string>,
        status: workflow.status,
        error: workflow.error,
      },
      workflow.status,
    )
  } catch (error) {
    log.error('[WorkflowEngine] Failed to persist workflow state:', error)
  }
}

/**
 * Run a task if it's ready (prerequisites met and inputs available)
 */
async function runTaskIfReady(
  workflow: Workflow,
  jobId: string,
  taskName: TaskName,
): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflowInstance = store.getWorkflow(jobId)
  const context = store.getContext(jobId)

  if (!workflowInstance || !context) {
    return
  }

  const status = workflowInstance.taskStates[taskName]
  if (status !== 'pending') {
    return
  }

  // Check prerequisites
  const completedTasks = new Set<TaskName>()
  for (const [name, s] of Object.entries(workflowInstance.taskStates)) {
    if (s === 'completed') {
      completedTasks.add(name as TaskName)
    }
  }

  if (!arePrerequisitesSatisfied(workflow, taskName, completedTasks)) {
    log.debug(`[WorkflowEngine] Task ${taskName} waiting on prerequisites`)
    return
  }

  // Check inputs
  const task = getTask(taskName)
  if (!task) {
    await failTask(jobId, taskName, `Task ${taskName} not registered`)
    return
  }

  const input = resolveTaskInput(task, context)
  if (input === null) {
    const missing = getMissingInputs(task, context)
    log.debug(
      `[WorkflowEngine] Task ${taskName} blocked on inputs: ${missing.join(', ')}`,
    )
    return
  }

  // Run the task
  await executeTask(workflow, jobId, task, input)
}

/**
 * Execute a task
 */
async function executeTask<T extends TaskName>(
  workflow: Workflow,
  jobId: string,
  task: Task<T>,
  input: Parameters<Task<T>['execute']>[0],
): Promise<void> {
  const store = useWorkflowStore.getState()
  const taskName = task.name

  // Verify workflow is still running
  const workflowInstance = store.getWorkflow(jobId)
  if (!workflowInstance || workflowInstance.status !== 'running') {
    log.warn(
      `[WorkflowEngine] Task ${taskName} skipped - workflow not running for job ${jobId}`,
    )
    return
  }

  log.info(`[WorkflowEngine] Running task: ${taskName}`)
  store.setTaskStatus(jobId, taskName, 'running')

  try {
    // Execute
    const result = await task.execute(input)

    // Persist task result
    await task.onSuccess(jobId, result)

    // Update context if task provides a key
    if (task.provides) {
      store.updateContext(jobId, { [task.provides]: result })
    }

    // Trigger tip
    if (task.tipEvent) {
      const tipData = task.getTipData?.(result)
      tip.trigger(task.tipEvent, tipData)
    }

    // Mark completed
    store.setTaskStatus(jobId, taskName, 'completed')
    log.info(`[WorkflowEngine] Task completed: ${taskName}`)

    // Persist workflow state
    const updatedWorkflow = store.getWorkflow(jobId)!
    await persistWorkflow(jobId, updatedWorkflow)

    // Start dependent tasks
    await startReadyTasks(workflow, jobId)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await failTask(jobId, taskName, message)
  }
}

/**
 * Start all tasks that are ready to run
 */
async function startReadyTasks(
  workflow: Workflow,
  jobId: string,
): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflowInstance = store.getWorkflow(jobId)
  const context = store.getContext(jobId)

  if (!workflowInstance || workflowInstance.status !== 'running' || !context) {
    return
  }

  // Find ready tasks
  const readyTasks: Array<TaskName> = []
  const completedTasks = new Set<TaskName>()

  for (const [name, status] of Object.entries(workflowInstance.taskStates)) {
    if (status === 'completed') {
      completedTasks.add(name as TaskName)
    }
  }

  for (const [taskName, status] of Object.entries(
    workflowInstance.taskStates,
  )) {
    if (status !== 'pending') continue

    if (
      arePrerequisitesSatisfied(workflow, taskName as TaskName, completedTasks)
    ) {
      const task = getTask(taskName as TaskName)
      if (task && resolveTaskInput(task, context) !== null) {
        readyTasks.push(taskName as TaskName)
      }
    }
  }

  // Check if workflow is complete
  if (readyTasks.length === 0) {
    const allCompleted = Object.values(workflowInstance.taskStates).every(
      (s) => s === 'completed',
    )
    if (allCompleted) {
      store.completeWorkflow(jobId)
      const completedWorkflow = store.getWorkflow(jobId)!
      await persistWorkflow(jobId, completedWorkflow)
      log.info(
        `[WorkflowEngine] Workflow '${workflowInstance.workflowName}' completed`,
      )
    }
    return
  }

  // Start ready tasks in parallel
  log.info(
    `[WorkflowEngine] Starting ${readyTasks.length} ready task(s): ${readyTasks.join(', ')}`,
  )
  for (const taskName of readyTasks) {
    void runTaskIfReady(workflow, jobId, taskName)
  }
}

/**
 * Fail a task and the workflow
 */
async function failTask(
  jobId: string,
  taskName: TaskName,
  error: string,
): Promise<void> {
  log.error(`[WorkflowEngine] Task ${taskName} failed: ${error}`)

  const store = useWorkflowStore.getState()
  store.setTaskStatus(jobId, taskName, 'failed', error)
  store.failWorkflow(jobId, `Task ${taskName} failed: ${error}`)

  // Persist failure
  const failedWorkflow = store.getWorkflow(jobId)!
  await persistWorkflow(jobId, failedWorkflow)
}
