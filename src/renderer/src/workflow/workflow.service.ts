import log from 'electron-log/renderer'
import { saveWorkflowState as saveWorkflowStateToDb } from '@api/jobs'
import { tip } from '@tips/tips.service'
import { resumeParsingTask } from '../tasks/resume-parsing.task'
import { checklistParsingTask } from '../tasks/checklist-parsing.task'
import { resumeTailoringTask } from '../tasks/resume-tailoring.task'
import { checklistMatchingTask } from '../tasks/checklist-matching.task'
import { scoreUpdatingTask } from '../tasks/score-updating.task'
import { jobInfoExtractingTask } from '../tasks/jobinfo-extracting.task'
import { CHECKLIST_MATCHING, SCORE_UPDATING } from './workflow.types'
import { WORKFLOWS } from './workflow.constants'
import { useWorkflowStore } from './workflow.store'
import type { Task, TaskName, TaskTypeMap } from '../tasks/base.task'
import type { Checklist } from '@type/checklist'
import type {
  TaskStateMap,
  Task as TaskType,
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
    templateId: string
  },
): Promise<void> {
  log.info('[Workflow] Starting create-application workflow for:', jobId)
  const workflowName: WorkflowName = 'create-application'
  const workflow = WORKFLOWS[workflowName]
  const tasks = Object.keys(workflow) as Array<TaskType>

  const store = useWorkflowStore.getState()
  store.startWorkflow(jobId, workflowName, tasks, {
    rawResumeContent: data.rawResumeContent,
    jobDescription: data.jobDescription,
    templateId: data.templateId,
  })

  await saveWorkflowState(jobId)

  // Start entry tasks in parallel (don't await - fire and forget)
  runTask(jobId, resumeParsingTask, {
    rawResumeContent: data.rawResumeContent,
    templateId: data.templateId,
  })
  runTask(jobId, checklistParsingTask, {
    jobDescription: data.jobDescription,
  })
  runTask(jobId, jobInfoExtractingTask, {
    jobDescription: data.jobDescription,
  })
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
    templateId: string
  },
): Promise<void> {
  const workflowName: WorkflowName = 'tailoring'
  const workflow = WORKFLOWS[workflowName]
  const tasks = Object.keys(workflow) as Array<TaskType>

  const store = useWorkflowStore.getState()
  store.startWorkflow(jobId, workflowName, tasks, {
    checklist: data.checklist,
    resumeStructure: data.resumeStructure,
    templateId: data.templateId,
  })

  await saveWorkflowState(jobId)

  // Start entry task
  runTask(jobId, resumeTailoringTask, {
    checklist: data.checklist,
    resumeStructure: data.resumeStructure,
    templateId: data.templateId,
  })
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
    templateId: string
  },
): Promise<void> {
  const workflowName: WorkflowName = 'checklist-only'
  const workflow = WORKFLOWS[workflowName]
  const tasks = Object.keys(workflow) as Array<TaskType>

  const store = useWorkflowStore.getState()
  store.startWorkflow(jobId, workflowName, tasks, {
    jobDescription: data.jobDescription,
    resumeStructure: data.resumeStructure,
    templateId: data.templateId,
  })

  await saveWorkflowState(jobId)

  // Start entry task
  runTask(jobId, checklistParsingTask, {
    jobDescription: data.jobDescription,
  })

  // Start job info extraction if JD is provided (existing mode, not scratch)
  if (data.jobDescription) {
    runTask(jobId, jobInfoExtractingTask, {
      jobDescription: data.jobDescription,
    })
  }
}

/**
 * Run a task and handle completion
 */
async function runTask<T extends TaskName>(
  jobId: string,
  task: Task<T>,
  input: TaskTypeMap[T]['input'],
): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)

  // Verify workflow exists and is running
  if (!workflow || workflow.status !== 'running') {
    log.warn(
      `[Workflow] Task ${task.name} skipped - workflow not running for job ${jobId}`,
    )
    return
  }

  store.setTaskStatus(jobId, task.name, 'running')

  try {
    const result = await task.execute(input)
    await task.onSuccess(jobId, result)

    if (task.contextKey) {
      store.updateContext(jobId, { [task.contextKey]: result })
    }
    if (task.tipEvent) {
      tip.trigger(task.tipEvent, task.getTipData?.(result))
    }

    store.setTaskStatus(jobId, task.name, 'completed')
    await saveWorkflowState(jobId)
    await startReadyTasks(jobId)
  } catch (error) {
    await handleTaskFailure(
      jobId,
      task.name,
      error instanceof Error ? error.message : String(error),
    )
  }
}

/**
 * Handle task failure
 */
async function handleTaskFailure(
  jobId: string,
  taskType: TaskType,
  error: string,
): Promise<void> {
  const store = useWorkflowStore.getState()
  const workflow = store.getWorkflow(jobId)

  if (!workflow) {
    log.warn(
      `[Workflow] Task ${taskType} failure ignored - workflow not in store for job ${jobId}`,
    )
    return
  }

  log.error(`[Workflow] Task ${taskType} failed:`, error)

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
          runTask(jobId, checklistMatchingTask, {
            checklist: context.checklist,
            resumeStructure: context.resumeStructure,
          })
        }
        break
      case SCORE_UPDATING:
        runTask(jobId, scoreUpdatingTask, { jobId })
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
): Array<TaskType> {
  const ready: Array<TaskType> = []

  for (const [taskType, taskDep] of Object.entries(workflow)) {
    const status = taskStates[taskType as TaskType]
    if (status !== 'pending') continue

    const allPrereqsCompleted = taskDep.prerequisites.every(
      (prereq) => taskStates[prereq] === 'completed',
    )

    if (allPrereqsCompleted) {
      ready.push(taskType as TaskType)
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
export async function retryFailedTasks(
  jobId: string,
): Promise<Array<TaskType>> {
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
    .map(([task]) => task as TaskType)

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

/**
 * Wait for a specific task to complete
 *
 * Used for batch creation: wait for resume.parsing before creating remaining apps
 */
export function waitForTaskCompletion(
  jobId: string,
  taskType: TaskType,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const store = useWorkflowStore.getState()
    const workflow = store.getWorkflow(jobId)

    // Check if already completed
    if (workflow?.taskStates[taskType] === 'completed') {
      resolve()
      return
    }

    // Check if already failed
    if (workflow?.taskStates[taskType] === 'failed') {
      reject(new Error(`Task ${taskType} failed`))
      return
    }

    // Subscribe to changes
    const unsubscribe = useWorkflowStore.subscribe((state) => {
      const instance = state.workflows[jobId]
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!instance) return

      const taskState = instance.taskStates[taskType]
      if (taskState === 'completed') {
        unsubscribe()
        resolve()
      } else if (taskState === 'failed') {
        unsubscribe()
        reject(new Error(`Task ${taskType} failed`))
      }
    })
  })
}
