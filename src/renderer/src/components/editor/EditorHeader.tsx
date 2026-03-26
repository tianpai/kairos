import { TailoringButton } from '@editor/TailoringButton'
import { PageHeader } from '@ui/PageHeader'
import SaveResumeButton from '@editor/SaveResumeButton'
import { DocumentConfigButton } from '@resumeForm/DocumentConfigButton'
import { useLayoutStore } from '@layout/layout.store'
import { BtnToggleChecklist } from '../ui/BtnToggleChecklist'
import { Score } from '../ui/Score'
import type { JobSummary } from '@api/jobs'
import { ExportButton } from '@/components/export/ExportButton'
import { ApplicationsButton } from '@/components/applications/ApplicationsButton'

interface EditorHeaderProps {
  jobId?: string
  jobApplication?: JobSummary
}

export function EditorHeader({ jobId, jobApplication }: EditorHeaderProps) {
  const { showChecklist, toggleChecklist } = useLayoutStore()

  const matchPercentage = jobApplication?.matchPercentage ?? 0
  const hasActiveJob = !!jobId && !!jobApplication

  return (
    <PageHeader
      left={
        <>
          <ApplicationsButton />
        </>
      }
      center={
        jobApplication?.companyName && jobApplication?.position ? (
          <>
            <span>{jobApplication.companyName}</span>
            <span className="mx-2">-</span>
            <span>{jobApplication.position}</span>
          </>
        ) : undefined
      }
      right={
        <>
          {hasActiveJob && (
            <>
              <Score score={matchPercentage} />
              <TailoringButton />
              <DocumentConfigButton />
              <BtnToggleChecklist
                condition={showChecklist}
                action={toggleChecklist}
              />
              <SaveResumeButton jobId={jobId} />
              <ExportButton
                targets={
                  jobApplication
                    ? [
                        {
                          id: jobApplication.id,
                          companyName: jobApplication.companyName,
                          position: jobApplication.position,
                        },
                      ]
                    : undefined
                }
              />
            </>
          )}
        </>
      }
    />
  )
}
