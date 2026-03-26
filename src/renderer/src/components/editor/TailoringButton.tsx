import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { WandSparkles } from 'lucide-react'
import { Button } from '@ui/Button'
import { useTailoringData } from '@hooks/useTailoringData'
import { saveResume } from '@api/jobs'
import {
  getWorkflowState,
  onWorkflowPushState,
  startWorkflow,
} from '@api/workflow'
import { useSelectedKeywordsStore } from '@/components/checklist/selectedKeywords.store'
import { useWorkflowRuntimeStore } from '@/hooks/workflowRuntime.store'
import { friendlyError } from '@/utils/error'

const EMPTY_SELECTED_KEYWORDS: string[] = []

export function TailoringButton() {
  const {
    jobId,
    checklist,
    resumeStructure,
    templateId,
    hasJobDescription,
    hasResumeContent,
  } = useTailoringData()

  const selectedKeywords = useSelectedKeywordsStore((state) =>
    jobId
      ? (state.selectedByJobId[jobId] ?? EMPTY_SELECTED_KEYWORDS)
      : EMPTY_SELECTED_KEYWORDS,
  )
  const runtimeWorkflow = useWorkflowRuntimeStore((state) =>
    jobId ? state.workflowsByJobId[jobId] : undefined,
  )
  const [isStarting, setIsStarting] = useState(false)

  const tasks = runtimeWorkflow?.tasks
  const isTailoringResume = tasks?.['resume.tailoring']?.status === 'running'
  const isMatchingTailoredResume =
    tasks?.['checklist.matching']?.status === 'running'
  const isAnyTaskRunning = tasks
    ? Object.values(tasks).some((t) => t.status === 'running')
    : false
  const isProcessing = isStarting || isAnyTaskRunning

  // Check if checklist matching is completed
  const isChecklistReady = Boolean(
    checklist &&
    (checklist.hardRequirements.length > 0 ||
      checklist.softRequirements.length > 0 ||
      checklist.preferredSkills.length > 0),
  )
  const isDisabled =
    isProcessing || !hasJobDescription || !hasResumeContent || !isChecklistReady

  const handleClick = useCallback(async () => {
    if (isProcessing) {
      return
    }

    if (!jobId || !checklist) {
      console.error('[Tailoring] Missing required data')
      return
    }

    setIsStarting(true)

    try {
      await saveResume(jobId, resumeStructure, templateId)
      await startWorkflow(jobId, 'tailoring')
    } catch (error) {
      setIsStarting(false)
      const message = error instanceof Error ? error.message : String(error)
      toast.error('Failed to start tailoring', {
        description: friendlyError(message),
      })
    }
  }, [jobId, checklist, isProcessing, resumeStructure, templateId])

  // Hydrate runtime workflow state on mount/job change for mid-workflow opens.
  useEffect(() => {
    if (!jobId) return

    let cancelled = false

    void getWorkflowState(jobId)
      .then((state) => {
        if (cancelled) return

        const runtimeStore = useWorkflowRuntimeStore.getState()
        if (state) {
          runtimeStore.setWorkflowState(jobId, state)
          return
        }

        runtimeStore.clearWorkflowState(jobId)
      })
      .catch(() => {
        // Keep existing runtime state on transient fetch errors.
      })

    return () => {
      cancelled = true
    }
  }, [jobId])

  useEffect(() => {
    setIsStarting(false)
  }, [jobId])

  // Start command has transitioned into live running state.
  useEffect(() => {
    if (isStarting && (isTailoringResume || isMatchingTailoredResume)) {
      setIsStarting(false)
    }
  }, [isStarting, isTailoringResume, isMatchingTailoredResume])

  // Stop optimistic starting state once workflow reports terminal events.
  useEffect(() => {
    if (!jobId) return

    const unsubscribe = onWorkflowPushState(({ jobId: eventJobId, state }) => {
      if (eventJobId !== jobId) return
      // null = completed, or any task failed
      if (
        state === null ||
        Object.values(state.tasks).some((t) => t.status === 'failed')
      ) {
        setIsStarting(false)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [jobId])

  // Build tooltip message
  let tooltipMessage = 'Tailor resume'
  if (!hasJobDescription) {
    tooltipMessage = 'Add job description to enable tailoring'
  } else if (!hasResumeContent) {
    tooltipMessage = 'Add resume content to enable tailoring'
  } else if (!isChecklistReady) {
    tooltipMessage = 'Waiting for checklist to be ready'
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      loading={isProcessing}
      tooltip={tooltipMessage}
      ariaLabel={tooltipMessage}
    >
      <WandSparkles size={16} />
    </Button>
  )
}
