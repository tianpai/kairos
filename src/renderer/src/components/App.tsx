import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Columns2, Columns3, PanelLeft } from 'lucide-react'
import { TailoringButton } from '@editor/TailoringButton'
import { PageHeader } from '@ui/PageHeader'
import { InvertedButton } from '@ui/InvertedButton'
import { getAllJobApplications, getJobApplication } from '@api/jobs'
import { useWorkflowSync } from '@hooks/useWorkflowSync'
import { useSyncJobApplicationToStore } from '@hooks/useSyncJobApplicationToStore'
import { useJobApplicationMutations } from '@hooks/useJobApplicationMutations'
import { useWorkflowStore } from '@workflow/workflow.store'
import { CHECKLIST_PARSING, RESUME_PARSING } from '@workflow/workflow.types'
import ResumeRender from '@editor/ResumeRender'
import ResumeForm from '@resumeForm/ResumeForm'
import Checklist from '@checklist/Checklist'
import ResumeParsingLoader from '@editor/ResumeParsingLoader'
import DownloadResumeButton from '@editor/DownloadResumeButton'
import SaveResumeButton from '@editor/SaveResumeButton'
import { DocumentConfigButton } from '@resumeForm/DocumentConfigButton'
import { EmptyState } from '@layout/EmptyState'
import { Sidebar } from '@sidebar/Sidebar'
import { AppLayout } from '@layout/AppLayout'
import { useLayoutStore } from '@layout/layout.store'
import { getScoreColor } from '@/utils/scoreThresholds'

export default function App() {
  const navigate = useNavigate()
  const { jobId } = useSearch({ from: '/' })

  // Layout state from store
  const { sidebarCollapsed, showChecklist, toggleSidebar, toggleChecklist } =
    useLayoutStore()

  // Fetch all applications for sidebar
  const { data: applications = [] } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: getAllJobApplications,
  })

  // Fetch selected application details
  const { data: jobApplication } = useQuery({
    queryKey: ['jobApplication', jobId],
    queryFn: () => getJobApplication(jobId!),
    enabled: !!jobId,
  })

  // Mutations for edit and delete
  const { handleUpdate, handleDelete } = useJobApplicationMutations(jobId)

  // Sync workflow state between DB and store
  useWorkflowSync(jobId, jobApplication)

  // Get loading states from workflow store (requires jobId)
  const isParsingResume = useWorkflowStore((state) =>
    jobId ? state.isTaskRunning(jobId, RESUME_PARSING) : false,
  )
  const isParsingChecklist = useWorkflowStore((state) =>
    jobId ? state.isTaskRunning(jobId, CHECKLIST_PARSING) : false,
  )

  // Sync job application data to store (templateId + tailored resume)
  useSyncJobApplicationToStore(jobApplication)

  const handleSelectApplication = (id: string) => {
    navigate({ to: '/', search: { jobId: id } })
  }

  const handleUploadSuccess = (newJobId: string) => {
    navigate({ to: '/', search: { jobId: newJobId } })
  }

  const companyName = jobApplication?.companyName
  const position = jobApplication?.position
  const matchPercentage = jobApplication?.matchPercentage ?? 0
  const isBuiltFromScratch = !jobApplication?.originalResume

  const hasApplications = applications.length > 0
  const hasSelection = !!jobId && !!jobApplication

  return (
    <AppLayout
      header={
        <PageHeader
          left={
            <>
              <InvertedButton
                onClick={toggleSidebar}
                ariaLabel={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                <PanelLeft size={16} />
              </InvertedButton>
              {hasSelection && (
                <InvertedButton
                  onClick={toggleChecklist}
                  ariaLabel={
                    showChecklist
                      ? 'Switch to 2 columns'
                      : 'Switch to 3 columns'
                  }
                  title="Toggle columns"
                  className="-mr-0.5"
                >
                  {showChecklist ? (
                    <Columns2 size={16} />
                  ) : (
                    <Columns3 size={16} />
                  )}
                </InvertedButton>
              )}
            </>
          }
          center={
            hasSelection &&
            companyName &&
            position && (
              <>
                <span>{companyName}</span>
                <span className="mx-2">-</span>
                <span>{position}</span>
              </>
            )
          }
          right={
            hasSelection && (
              <>
                <span
                  className="mr-2 text-sm font-medium"
                  style={{ color: getScoreColor(matchPercentage) }}
                >
                  {Math.round(matchPercentage)}%
                </span>
                <TailoringButton />
                <DocumentConfigButton />
                <SaveResumeButton
                  jobId={jobId}
                  isBuiltFromScratch={isBuiltFromScratch}
                />
                <DownloadResumeButton
                  companyName={companyName}
                  position={position}
                />
              </>
            )
          }
        />
      }
      sidebar={
        <Sidebar
          applications={applications}
          selectedId={jobId}
          onSelect={handleSelectApplication}
          collapsed={sidebarCollapsed}
          onUploadSuccess={handleUploadSuccess}
          onEdit={handleUpdate}
          onDelete={handleDelete}
        />
      }
    >
      {hasSelection ? (
        <div className="relative grid h-full grid-cols-8 overflow-hidden">
          <div
            className={`h-full overflow-hidden ${showChecklist ? 'col-span-2' : 'col-span-3'}`}
          >
            <ResumeForm />
          </div>
          <div
            className={`h-full overflow-hidden ${showChecklist ? 'col-span-4' : 'col-span-5'}`}
          >
            <ResumeRender expanded={!showChecklist} />
          </div>
          {showChecklist && (
            <div className="relative z-10 col-span-2 h-full overflow-hidden">
              <Checklist jobId={jobId} />
            </div>
          )}
          <ResumeParsingLoader
            isParsingResume={isParsingResume}
            isParsingChecklist={isParsingChecklist}
          />
        </div>
      ) : (
        <EmptyState hasApplications={hasApplications} />
      )}
    </AppLayout>
  )
}
