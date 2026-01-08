import { useCallback, useEffect } from 'react'
import { WandSparkles } from 'lucide-react'
import { Button } from '@ui/Button'
import { useTailoringData } from '@hooks/useTailoringData'
import {
  CHECKLIST_MATCHING,
  RESUME_TAILORING,
  startWorkflow,
  useWorkflowStore,
} from '../../workflow'
import { useShortcutStore } from '@/components/layout/shortcut.store'

export function TailoringButton() {
  const {
    jobId,
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

  // Get loading states from workflow store
  const isTailoringResume = useWorkflowStore((state) =>
    jobId ? state.isTaskRunning(jobId, RESUME_TAILORING) : false,
  )
  const isMatchingTailoredResume = useWorkflowStore((state) =>
    jobId ? state.isTaskRunning(jobId, CHECKLIST_MATCHING) : false,
  )

  // Check if checklist matching is completed
  const isChecklistReady = Boolean(
    checklist &&
      (checklist.hardRequirements.length > 0 ||
        checklist.softRequirements.length > 0 ||
        checklist.preferredSkills.length > 0),
  )

  const handleClick = useCallback(() => {
    if (!jobId || !checklist) {
      console.error('[Tailoring] Missing required data')
      return
    }

    startWorkflow('tailoring', jobId, {
      checklist,
      resumeStructure,
      templateId,
    })
  }, [jobId, checklist, resumeStructure, templateId])

  // Determine disabled state and tooltip
  const isProcessing = isTailoringResume || isMatchingTailoredResume
  const missingJobDescription = !hasJobDescription
  const missingResumeContent = !hasResumeContent
  const missingChecklist = !isChecklistReady

  const isDisabled =
    isProcessing ||
    missingJobDescription ||
    missingResumeContent ||
    missingChecklist

  // Listen for keyboard shortcut
  useEffect(() => {
    if (tailorRequested) {
      if (!isDisabled) {
        handleClick()
      }
      clearTailorRequest()
    }
  }, [tailorRequested, isDisabled, handleClick, clearTailorRequest])

  // Build tooltip message
  let tooltipMessage = 'Tailor resume'
  if (missingJobDescription) {
    tooltipMessage = 'Add job description to enable tailoring'
  } else if (missingResumeContent) {
    tooltipMessage = 'Add resume content to enable tailoring'
  } else if (missingChecklist) {
    tooltipMessage = 'Waiting for checklist to be ready'
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      loading={isProcessing}
      title={tooltipMessage}
      ariaLabel={tooltipMessage}
    >
      <WandSparkles size={16} />
    </Button>
  )
}
