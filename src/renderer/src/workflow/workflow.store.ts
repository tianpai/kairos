import { create } from 'zustand'
import type {
  Task,
  TaskStatus,
  TaskStateMap,
  WorkflowInstance,
  WorkflowName,
  WorkflowContext,
} from './workflow.types'

interface WorkflowState {
  // Current active workflow (one per job at a time)
  activeWorkflow: WorkflowInstance | null
  // Context for accumulating task results
  context: WorkflowContext | null

  // Actions
  startWorkflow: (
    jobId: string,
    workflowName: WorkflowName,
    tasks: Task[],
    initialContext: Partial<WorkflowContext>,
  ) => void
  setTaskStatus: (task: Task, status: TaskStatus, error?: string) => void
  updateContext: (updates: Partial<WorkflowContext>) => void
  completeWorkflow: () => void
  failWorkflow: (error: string) => void
  clearWorkflow: () => void

  // Selectors
  getTaskStatus: (task: Task) => TaskStatus | undefined
  isTaskRunning: (task: Task) => boolean
  isWorkflowRunning: () => boolean
  hasFailedTask: () => boolean
}

export const useWorkflowStore = create<WorkflowState>()((set, get) => ({
  activeWorkflow: null,
  context: null,

  startWorkflow: (jobId, workflowName, tasks, initialContext) => {
    const taskStates: TaskStateMap = {}
    tasks.forEach((task) => {
      taskStates[task] = 'pending'
    })

    set({
      activeWorkflow: {
        jobId,
        workflowName,
        taskStates,
        status: 'running',
      },
      context: {
        jobId,
        ...initialContext,
      },
    })
  },

  setTaskStatus: (task, status, error) => {
    set((state) => {
      if (!state.activeWorkflow) return state
      return {
        activeWorkflow: {
          ...state.activeWorkflow,
          taskStates: {
            ...state.activeWorkflow.taskStates,
            [task]: status,
          },
          error: error ?? state.activeWorkflow.error,
        },
      }
    })
  },

  updateContext: (updates) => {
    set((state) => {
      if (!state.context) return state
      return {
        context: {
          ...state.context,
          ...updates,
        },
      }
    })
  },

  completeWorkflow: () => {
    set((state) => {
      if (!state.activeWorkflow) return state
      return {
        activeWorkflow: {
          ...state.activeWorkflow,
          status: 'completed',
        },
      }
    })
  },

  failWorkflow: (error) => {
    set((state) => {
      if (!state.activeWorkflow) return state
      return {
        activeWorkflow: {
          ...state.activeWorkflow,
          status: 'failed',
          error,
        },
      }
    })
  },

  clearWorkflow: () => {
    set({ activeWorkflow: null, context: null })
  },

  // Selectors
  getTaskStatus: (task) => {
    const workflow = get().activeWorkflow
    return workflow?.taskStates[task]
  },

  isTaskRunning: (task) => {
    return get().getTaskStatus(task) === 'running'
  },

  isWorkflowRunning: () => {
    return get().activeWorkflow?.status === 'running'
  },

  hasFailedTask: () => {
    const workflow = get().activeWorkflow
    if (!workflow) return false
    return Object.values(workflow.taskStates).some((s) => s === 'failed')
  },
}))
