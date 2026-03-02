import { create } from 'zustand'
import type { WorkflowStepsData } from '@type/workflow'

interface WorkflowRuntimeState {
  workflowsByJobId: Record<string, WorkflowStepsData>
  setWorkflowState: (jobId: string, workflow: WorkflowStepsData) => void
  clearWorkflowState: (jobId: string) => void
}

export const useWorkflowRuntimeStore = create<WorkflowRuntimeState>()(
  (set) => ({
    workflowsByJobId: {},
    setWorkflowState: (jobId, workflow) =>
      set((state) => ({
        workflowsByJobId: {
          ...state.workflowsByJobId,
          [jobId]: workflow,
        },
      })),
    clearWorkflowState: (jobId) =>
      set((state) => {
        if (!(jobId in state.workflowsByJobId)) {
          return state
        }

        const next = { ...state.workflowsByJobId }
        delete next[jobId]
        return { workflowsByJobId: next }
      }),
  }),
)
