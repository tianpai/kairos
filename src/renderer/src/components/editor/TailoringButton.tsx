import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { WandSparkles } from 'lucide-react'
import { Button } from '@ui/Button'
import { useTailoringData } from '@hooks/useTailoringData'
import { saveResume } from '@api/jobs'
import {
  getWorkflowState,
  onWorkflowCompleted,
  onWorkflowTaskFailed,
  startTailoring,
} from '@api/workflow'
import { CHECKLIST_MATCHING, RESUME_TAILORING } from '@type/task-names'
import { useShortcutStore } from '@/components/layout/shortcut.store'
import { useSelectedKeywordsStore } from '@/components/checklist/selectedKeywords.store'
import { useWorkflowRuntimeStore } from '@/hooks/workflowRuntime.store'
import { friendlyError } from '@/utils/error'

const EMPTY_SELECTED_KEYWORDS: string[] = []

export function TailoringButton() {
  const {
    jobId,
    jobApplication,
    checklist,
    resumeStructure,
    templateId,
    hasJobDescription,
    hasResumeContent,
  } = useTailoringData()

  const tailorRequested = useShortcutStore((state) => state.tailorRequested)
  const clearTailorRequest = useShortcutStore(
    (state) => state.clearTailorRequest,
  )
  const selectedKeywords = useSelectedKeywordsStore((state) =>
    jobId
      ? (state.selectedByJobId[jobId] ?? EMPTY_SELECTED_KEYWORDS)
      : EMPTY_SELECTED_KEYWORDS,
  )
  const runtimeWorkflow = useWorkflowRuntimeStore((state) =>
    jobId ? state.workflowsByJobId[jobId] : undefined,
  )
  const [isStarting, setIsStarting] = useState(false)

  const taskStates =
    runtimeWorkflow?.taskStates ?? jobApplication?.workflowSteps?.taskStates
  const workflowStatus =
    runtimeWorkflow?.status ??
    jobApplication?.workflowStatus ??
    jobApplication?.workflowSteps?.status
  const isWorkflowRunning = workflowStatus === 'running'
  const isTailoringResume = taskStates?.[RESUME_TAILORING] === 'running'
  const isMatchingTailoredResume =
    taskStates?.[CHECKLIST_MATCHING] === 'running'
  const isProcessing =
    isStarting ||
    isWorkflowRunning ||
    isTailoringResume ||
    isMatchingTailoredResume

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
      await startTailoring({
        jobId,
        needTailoring: selectedKeywords,
      })
    } catch (error) {
      setIsStarting(false)
      const message = error instanceof Error ? error.message : String(error)
      toast.error('Failed to start tailoring', {
        description: friendlyError(message),
      })
    }
  }, [
    jobId,
    checklist,
    isProcessing,
    resumeStructure,
    templateId,
    selectedKeywords,
  ])

  // Hydrate runtime workflow state on mount/job change for mid-workflow opens.
  useEffect(() => {
    if (!jobId) return

    let cancelled = false

    void getWorkflowState({ jobId })
      .then((workflow) => {
        if (cancelled) return

        const runtimeStore = useWorkflowRuntimeStore.getState()
        if (workflow) {
          runtimeStore.setWorkflowState(jobId, workflow)
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

  // Listen for keyboard shortcut
  useEffect(() => {
    if (tailorRequested) {
      if (!isDisabled) {
        void handleClick()
      }
      clearTailorRequest()
    }
  }, [tailorRequested, isDisabled, handleClick, clearTailorRequest])

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

    const unsubscribeCompleted = onWorkflowCompleted((payload) => {
      if (payload.jobId === jobId) {
        setIsStarting(false)
      }
    })

    const unsubscribeTaskFailed = onWorkflowTaskFailed((payload) => {
      if (payload.jobId === jobId) {
        setIsStarting(false)
      }
    })

    return () => {
      unsubscribeCompleted()
      unsubscribeTaskFailed()
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
