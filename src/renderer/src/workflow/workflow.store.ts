import { create } from 'zustand'
import type {
  Task,
  TaskStateMap,
  TaskStatus,
  WorkflowContext,
  WorkflowInstance,
  WorkflowName,
} from './workflow.types'

interface WorkflowState {
  // Map of jobId -> WorkflowInstance (supports multiple concurrent workflows)
  workflows: Record<string, WorkflowInstance>
  // Map of jobId -> WorkflowContext
  contexts: Record<string, WorkflowContext>

  // Actions (all require jobId)
  startWorkflow: (
    jobId: string,
    workflowName: WorkflowName,
    tasks: Array<Task>,
    initialContext: Partial<WorkflowContext>,
  ) => void
  loadWorkflow: (
    jobId: string,
    workflow: WorkflowInstance,
    context?: WorkflowContext,
  ) => void
  setTaskStatus: (
    jobId: string,
    task: Task,
    status: TaskStatus,
    error?: string,
  ) => void
  updateContext: (jobId: string, updates: Partial<WorkflowContext>) => void
  completeWorkflow: (jobId: string) => void
  failWorkflow: (jobId: string, error: string) => void
  clearWorkflow: (jobId: string) => void

  // Selectors (all require jobId)
  getWorkflow: (jobId: string) => WorkflowInstance | undefined
  getContext: (jobId: string) => WorkflowContext | undefined
  getTaskStatus: (jobId: string, task: Task) => TaskStatus | undefined
  isTaskRunning: (jobId: string, task: Task) => boolean
  isWorkflowRunning: (jobId: string) => boolean
  hasFailedTask: (jobId: string) => boolean
}

export const useWorkflowStore = create<WorkflowState>()((set, get) => ({
  workflows: {},
  contexts: {},

  startWorkflow: (jobId, workflowName, tasks, initialContext) => {
    const taskStates: TaskStateMap = {}
    tasks.forEach((task) => {
      taskStates[task] = 'pending'
    })

    set((state) => ({
      workflows: {
        ...state.workflows,
        [jobId]: {
          jobId,
          workflowName,
          taskStates,
          status: 'running',
        },
      },
      contexts: {
        ...state.contexts,
        [jobId]: {
          jobId,
          ...initialContext,
        },
      },
    }))
  },

  loadWorkflow: (jobId, workflow, context) => {
    set((state) => ({
      workflows: {
        ...state.workflows,
        [jobId]: workflow,
      },
      contexts: context
        ? { ...state.contexts, [jobId]: context }
        : state.contexts,
    }))
  },

  setTaskStatus: (jobId, task, status, error) => {
    set((state) => {
      const workflow = state.workflows[jobId]
      return {
        workflows: {
          ...state.workflows,
          [jobId]: {
            ...workflow,
            taskStates: {
              ...workflow.taskStates,
              [task]: status,
            },
            error: error ?? workflow.error,
          },
        },
      }
    })
  },

  updateContext: (jobId, updates) => {
    set((state) => {
      const context = state.contexts[jobId]
      return {
        contexts: {
          ...state.contexts,
          [jobId]: {
            ...context,
            ...updates,
          },
        },
      }
    })
  },

  completeWorkflow: (jobId) => {
    set((state) => {
      const workflow = state.workflows[jobId]
      return {
        workflows: {
          ...state.workflows,
          [jobId]: {
            ...workflow,
            status: 'completed',
          },
        },
      }
    })
  },

  failWorkflow: (jobId, error) => {
    set((state) => {
      const workflow = state.workflows[jobId]
      return {
        workflows: {
          ...state.workflows,
          [jobId]: {
            ...workflow,
            status: 'failed',
            error,
          },
        },
      }
    })
  },

  clearWorkflow: (jobId) => {
    set((state) => {
      const { [jobId]: _removedWorkflow, ...restWorkflows } = state.workflows
      const { [jobId]: _removedContext, ...restContexts } = state.contexts
      return {
        workflows: restWorkflows,
        contexts: restContexts,
      }
    })
  },

  // Selectors
  getWorkflow: (jobId) => {
    return get().workflows[jobId]
  },

  getContext: (jobId) => {
    return get().contexts[jobId]
  },

  getTaskStatus: (jobId, task) => {
    const workflow = get().workflows[jobId]
    return workflow?.taskStates[task]
  },

  isTaskRunning: (jobId, task) => {
    return get().getTaskStatus(jobId, task) === 'running'
  },

  isWorkflowRunning: (jobId) => {
    return get().workflows[jobId]?.status === 'running'
  },

  hasFailedTask: (jobId) => {
    const workflow = get().workflows[jobId]
    return workflow
      ? Object.values(workflow.taskStates).some((s) => s === 'failed')
      : false
  },
}))
