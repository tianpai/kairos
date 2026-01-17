import { TailoringButton } from '@editor/TailoringButton'
import { PageHeader } from '@ui/PageHeader'
import { Button } from '@ui/Button'
import DownloadResumeButton from '@editor/DownloadResumeButton'
import SaveResumeButton from '@editor/SaveResumeButton'
import { DocumentConfigButton } from '@resumeForm/DocumentConfigButton'
import { useLayoutStore } from '@layout/layout.store'
import { useNavigate } from '@tanstack/react-router'
import { Columns2, Columns3, GalleryVerticalEnd } from 'lucide-react'
import type { JobApplicationDetails } from '@api/jobs'
import { getScoreColor } from '@/utils/scoreThresholds'
import NewApplicationButton from '@/components/upload/NewApplicationButton'

interface AppHeaderProps {
  hasActiveJob: boolean
  jobId?: string
  jobApplication?: JobApplicationDetails
}

export function AppHeader({
  hasActiveJob,
  jobId,
  jobApplication,
}: AppHeaderProps) {
  const navigate = useNavigate()
  const { showChecklist, toggleChecklist } = useLayoutStore()

  const companyName = jobApplication?.companyName
  const position = jobApplication?.position
  const matchPercentage = jobApplication?.matchPercentage ?? 0

  return (
    <PageHeader
      left={
        <>
          <Button
            onClick={() => navigate({ to: '/applications' })}
            ariaLabel="All applications"
            title="All applications"
          >
            <GalleryVerticalEnd size={16} />
          </Button>
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
              <span
                className="mr-2 text-sm font-medium"
                style={{ color: getScoreColor(matchPercentage) }}
              >
                {Math.round(matchPercentage)}%
              </span>
              <TailoringButton />
              <DocumentConfigButton />
              <Button
                onClick={toggleChecklist}
                ariaLabel={
                  showChecklist ? 'Switch to 2 columns' : 'Switch to 3 columns'
                }
                title="Toggle columns"
              >
                {showChecklist ? (
                  <Columns2 size={16} />
                ) : (
                  <Columns3 size={16} />
                )}
              </Button>
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
