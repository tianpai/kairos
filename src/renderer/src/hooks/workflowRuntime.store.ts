import { create } from 'zustand'
import type { WfState } from '@type/workflow'

interface WorkflowRuntimeState {
  workflowsByJobId: Record<string, WfState>
  setWorkflowState: (jobId: string, workflow: WfState) => void
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
