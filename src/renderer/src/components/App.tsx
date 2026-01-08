import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Columns2, Columns3, PanelLeft } from 'lucide-react'
import { TailoringButton } from '@editor/TailoringButton'
import { PageHeader } from '@ui/PageHeader'
import { Button } from '@ui/Button'
import { getAllJobApplications, getJobApplication } from '@api/jobs'
import { useWorkflowSync } from '@hooks/useWorkflowSync'
import { useSyncJobApplicationToStore } from '@hooks/useSyncJobApplicationToStore'
import { useJobApplicationMutations } from '@hooks/useJobApplicationMutations'
import ResumeRender from '@editor/ResumeRender'
import ResumeForm from '@resumeForm/ResumeForm'
import Checklist from '@checklist/Checklist'
import DownloadResumeButton from '@editor/DownloadResumeButton'
import SaveResumeButton from '@editor/SaveResumeButton'
import { DocumentConfigButton } from '@resumeForm/DocumentConfigButton'
import { EmptyState } from '@layout/EmptyState'
import { Sidebar } from '@sidebar/Sidebar'
import { AppLayout } from '@layout/AppLayout'
import { useLayoutStore } from '@layout/layout.store'
import { useShortcutStore } from '@layout/shortcut.store'
import { getScoreColor } from '@/utils/scoreThresholds'
import NewApplicationButton from '@/components/upload/NewApplicationButton'
import { BatchExportModal } from '@/components/export/BatchExportModal'

export default function App() {
  const navigate = useNavigate()
  const { jobId } = useSearch({ from: '/' })

  // Layout state from store
  const { sidebarCollapsed, showChecklist, toggleSidebar, toggleChecklist } =
    useLayoutStore()

  // Navigation shortcut state
  const navigationRequested = useShortcutStore(
    (state) => state.navigationRequested,
  )
  const clearNavigationRequest = useShortcutStore(
    (state) => state.clearNavigationRequest,
  )

  // Batch export state
  const [showBatchExport, setShowBatchExport] = useState(false)
  const batchExportRequested = useShortcutStore(
    (state) => state.batchExportRequested,
  )
  const clearBatchExportRequest = useShortcutStore(
    (state) => state.clearBatchExportRequest,
  )

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

  // Sync job application data to store (templateId + tailored resume)
  useSyncJobApplicationToStore(jobApplication)

  // Handle batch export shortcut
  useEffect(() => {
    if (batchExportRequested) {
      setShowBatchExport(true)
      clearBatchExportRequest()
    }
  }, [batchExportRequested, clearBatchExportRequest])

  // Handle navigation shortcuts
  useEffect(() => {
    if (!navigationRequested || applications.length === 0) {
      if (navigationRequested) {
        clearNavigationRequest()
      }
      return
    }

    const currentIndex = applications.findIndex((app) => app.id === jobId)
    let targetId: string | undefined

    switch (navigationRequested) {
      case 'prev':
        // Move UP in sidebar (toward newer items at top)
        targetId = applications[Math.max(0, currentIndex - 1)]?.id
        break
      case 'next':
        // Move DOWN in sidebar (toward older items at bottom)
        targetId = applications[Math.min(applications.length - 1, currentIndex + 1)]?.id
        break
      case 'oldest':
        // Jump to bottom of sidebar
        targetId = applications[applications.length - 1]?.id
        break
      case 'latest':
        // Jump to top of sidebar
        targetId = applications[0]?.id
        break
    }

    if (targetId && targetId !== jobId) {
      navigate({ to: '/', search: { jobId: targetId } })
    }

    clearNavigationRequest()
  }, [navigationRequested, applications, jobId, navigate, clearNavigationRequest])

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
    <>
    <AppLayout
      header={
        <PageHeader
          left={
            <>
              <Button
                onClick={toggleSidebar}
                ariaLabel={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                <PanelLeft size={16} />
              </Button>
              <NewApplicationButton onSuccess={handleUploadSuccess} />
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
                <Button
                  onClick={toggleChecklist}
                  ariaLabel={
                    showChecklist
                      ? 'Switch to 2 columns'
                      : 'Switch to 3 columns'
                  }
                  title="Toggle columns"
                >
                  {showChecklist ? (
                    <Columns2 size={16} />
                  ) : (
                    <Columns3 size={16} />
                  )}
                </Button>
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
        </div>
      ) : (
        <EmptyState hasApplications={hasApplications} />
      )}
    </AppLayout>

    <BatchExportModal
      open={showBatchExport}
      onClose={() => setShowBatchExport(false)}
      applications={applications}
    />
  </>
  )
}
