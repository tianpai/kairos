import { TailoringButton } from '@editor/TailoringButton'
import { PageHeader } from '@ui/PageHeader'
import DownloadResumeButton from '@editor/DownloadResumeButton'
import SaveResumeButton from '@editor/SaveResumeButton'
import { DocumentConfigButton } from '@resumeForm/DocumentConfigButton'
import { useLayoutStore } from '@layout/layout.store'
import { BtnToggleChecklist } from '../ui/BtnToggleChecklist'
import { Score } from '../ui/Score'
import type { JobApplicationDetails } from '@api/jobs'
import NewApplicationButton from '@/components/upload/NewApplicationButton'
import { ApplicationsButton } from '@/components/applications/ApplicationsButton'

interface EditorHeaderProps {
  jobId?: string
  jobApplication?: JobApplicationDetails
}

export function EditorHeader({ jobId, jobApplication }: EditorHeaderProps) {
  const { showChecklist, toggleChecklist } = useLayoutStore()

  const companyName = jobApplication?.companyName
  const position = jobApplication?.position
  const matchPercentage = jobApplication?.matchPercentage ?? 0
  const hasActiveJob = !!jobId && !!jobApplication

  return (
    <PageHeader
      left={
        <>
          <ApplicationsButton />
          <NewApplicationButton />
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
              <DownloadResumeButton
                companyName={companyName}
                position={position}
              />
            </>
          )}
        </>
      }
    />
  )
}
