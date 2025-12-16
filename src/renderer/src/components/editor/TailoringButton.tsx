import { WandSparkles } from 'lucide-react'
import { useWorkflowStore } from '@workflow/workflow.store'
import { startTailoringWorkflow } from '@workflow/workflow.service'
import { CHECKLIST_MATCHING, RESUME_TAILORING } from '@workflow/workflow.types'
import { InvertedButton } from '@ui/InvertedButton'
import { useTailoringData } from '@hooks/useTailoringData'

export function TailoringButton() {
  const { jobId, checklist, resumeStructure, jsonSchema } = useTailoringData()

  // Get loading states from workflow store
  const isTailoringResume = useWorkflowStore((state) =>
    state.isTaskRunning(RESUME_TAILORING),
  )
  const isMatchingTailoredResume = useWorkflowStore((state) =>
    state.isTaskRunning(CHECKLIST_MATCHING),
  )

  // Check if checklist matching is completed
  const isChecklistReady = Boolean(
    checklist &&
      (checklist.hardRequirements.length > 0 ||
        checklist.softRequirements.length > 0 ||
        checklist.preferredSkills.length > 0),
  )

  const handleClick = () => {
    if (!jobId || !checklist) {
      console.error('[Tailoring] Missing required data')
      return
    }

    startTailoringWorkflow(jobId, {
      checklist,
      resumeStructure,
      jsonSchema,
    })
  }

  // Determine if button is in loading state
  const isLoading =
    !isChecklistReady || isTailoringResume || isMatchingTailoredResume

  return (
    <InvertedButton
      onClick={handleClick}
      disabled={isLoading}
      loading={isLoading}
      title="Tailor resume"
      ariaLabel="Tailor resume"
    >
      <WandSparkles size={16} />
    </InvertedButton>
  )
}
