import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkflowStore } from '@workflow/workflow.store'
import { useResumeStore } from '@typst-compiler/resumeState'
import type { TemplateData } from '@templates/template.types'

/**
 * Syncs workflow state changes to TanStack Query cache and resume store
 *
 * When tasks complete, this hook:
 * 1. Invalidates the jobApplication query to refetch fresh data from DB
 * 2. Loads the new resume data into the resume store
 */
export function useWorkflowSync(jobId: string | undefined) {
  const queryClient = useQueryClient()
  const loadParsedResume = useResumeStore((state) => state.loadParsedResume)
  const activeWorkflow = useWorkflowStore((state) => state.activeWorkflow)
  const context = useWorkflowStore((state) => state.context)

  // Track previous task states to detect completions
  const prevTaskStatesRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!jobId || !activeWorkflow || activeWorkflow.jobId !== jobId) {
      prevTaskStatesRef.current = {}
      return
    }

    const currentTaskStates = activeWorkflow.taskStates
    const prevTaskStates = prevTaskStatesRef.current

    // Find tasks that just completed
    const justCompleted: string[] = []
    for (const [task, status] of Object.entries(currentTaskStates)) {
      if (status === 'completed' && prevTaskStates[task] !== 'completed') {
        justCompleted.push(task)
      }
    }

    // Update ref for next comparison
    prevTaskStatesRef.current = { ...currentTaskStates }

    if (justCompleted.length === 0) return

    // Invalidate job application query to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ['jobApplication', jobId] })

    // If resume parsing or tailoring completed, load into resume store
    if (
      justCompleted.includes('resume.parsing') ||
      justCompleted.includes('resume.tailoring')
    ) {
      if (context?.resumeStructure) {
        loadParsedResume(context.resumeStructure as TemplateData)
      }
    }
  }, [jobId, activeWorkflow, context, queryClient, loadParsedResume])
}
