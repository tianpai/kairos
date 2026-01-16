/**
 * Workflow Store (Zustand)
 *
 * Manages workflow state for multiple concurrent jobs.
 * Each job has its own WorkflowInstance and WorkflowContext.
 */

import { create } from 'zustand'
import type { TaskName, WorkflowContext } from '@type/task-contracts'
import type { TaskStatus, WorkflowStatus } from '@type/workflow'

// =============================================================================
// Types
// =============================================================================

export type TaskStateMap = Partial<Record<TaskName, TaskStatus>>

export interface WorkflowInstance {
  jobId: string
  workflowName: string
  taskStates: TaskStateMap
  status: WorkflowStatus
  error?: string
}

export type { TaskStatus, WorkflowStatus }

// =============================================================================
// Store Interface
// =============================================================================

interface WorkflowState {
  // State: Map of jobId -> WorkflowInstance (supports multiple concurrent workflows)
  workflows: Record<string, WorkflowInstance>
  // State: Map of jobId -> WorkflowContext
  contexts: Record<string, WorkflowContext>

  // Actions
  loadWorkflow: (
    jobId: string,
    workflow: WorkflowInstance,
    context?: WorkflowContext,
  ) => void
  updateContext: (jobId: string, updates: Partial<WorkflowContext>) => void

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
