/**
 * Workflow Store (Zustand)
 *
 * Manages workflow state for multiple concurrent jobs.
 * Each job has its own WorkflowInstance and WorkflowContext.
 */

import { create } from 'zustand'
import type { TaskName, WorkflowContext } from './task-contracts'

// =============================================================================
// Types
// =============================================================================

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'
export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed'

export type TaskStateMap = Partial<Record<TaskName, TaskStatus>>

export interface WorkflowInstance {
  jobId: string
  workflowName: string
  taskStates: TaskStateMap
  status: WorkflowStatus
  error?: string
}

// =============================================================================
// Store Interface
// =============================================================================

interface WorkflowState {
  // State: Map of jobId -> WorkflowInstance (supports multiple concurrent workflows)
  workflows: Record<string, WorkflowInstance>
  // State: Map of jobId -> WorkflowContext
  contexts: Record<string, WorkflowContext>

  // Actions
  initWorkflow: (
    jobId: string,
    workflowName: string,
    tasks: Array<TaskName>,
    initialContext: Partial<WorkflowContext>,
  ) => void
  loadWorkflow: (
    jobId: string,
    workflow: WorkflowInstance,
    context?: WorkflowContext,
  ) => void
  setTaskStatus: (
    jobId: string,
    task: TaskName,
    status: TaskStatus,
    error?: string,
  ) => void
  updateContext: (jobId: string, updates: Partial<WorkflowContext>) => void
  completeWorkflow: (jobId: string) => void
  failWorkflow: (jobId: string, error: string) => void
  clearWorkflow: (jobId: string) => void

  // Selectors
  getWorkflow: (jobId: string) => WorkflowInstance | undefined
  getContext: (jobId: string) => WorkflowContext | undefined
  getTaskStatus: (jobId: string, task: TaskName) => TaskStatus | undefined
  isTaskRunning: (jobId: string, task: TaskName) => boolean
  isWorkflowRunning: (jobId: string) => boolean
  hasFailedTask: (jobId: string) => boolean
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useWorkflowStore = create<WorkflowState>()((set, get) => ({
  workflows: {},
  contexts: {},

  initWorkflow: (jobId, workflowName, tasks, initialContext) => {
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
        } as WorkflowContext,
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
      if (!workflow) return state

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
      if (!context) return state

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
      if (!workflow) return state

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
      if (!workflow) return state

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
