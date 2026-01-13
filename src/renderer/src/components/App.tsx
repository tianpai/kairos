import { useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react'
import { getAllJobApplications, getJobApplication } from '@api/jobs'
import { useWorkflowSync } from '@hooks/useWorkflowSync'
import { useCurrentTheme } from '@hooks/useTheme'
import { useSyncJobApplicationToStore } from '@hooks/useSyncJobApplicationToStore'
import { useJobApplicationMutations } from '@hooks/useJobApplicationMutations'
import { useAppNavigation } from '@hooks/useAppNavigation'
import { useLastViewedApplication } from '@hooks/useLastViewedApplication'
import ResumeRender from '@editor/ResumeRender'
import ResumeForm from '@resumeForm/ResumeForm'
import Checklist from '@checklist/Checklist'
import { EmptyState } from '@layout/EmptyState'
import { Sidebar } from '@sidebar/Sidebar'
import { AppLayout } from '@layout/AppLayout'
import { AppHeader } from '@layout/AppHeader'
import { useLayoutStore } from '@layout/layout.store'
import { BatchExportButton } from '@/components/export/BatchExportButton'

export default function App() {
  const { jobId } = useSearch({ from: '/' })

  // Layout state from store
  const { sidebarCollapsed, showChecklist } = useLayoutStore()

  // Grid layout classes
  const gridClasses = {
    form: showChecklist ? 'col-span-2' : 'col-span-3',
    preview: showChecklist ? 'col-span-4' : 'col-span-5',
  }

  // Theme for toast notifications
  const { data: currentTheme } = useCurrentTheme()

  // Fetch all applications for sidebar
  const { data: applications = [] } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: getAllJobApplications,
  })

  // Fetch selected application details
  const { data: jobApplication } = useQuery({
    queryKey: ['jobApplication', jobId],
    queryFn: function () {
      return getJobApplication(jobId!)
    },
    enabled: !!jobId,
  })

  // Mutations for edit and delete
  const { handleUpdate, handleDelete } = useJobApplicationMutations(jobId)

  // Last viewed application persistence and navigation
  const { selectApplication, navigateAfterDelete } = useLastViewedApplication({
    jobId,
    applications,
  })

  // Sync workflow state between DB and store
  useWorkflowSync(jobId, jobApplication)

  // Sync job application data to store (templateId + tailored resume)
  useSyncJobApplicationToStore(jobApplication)

  // Handle keyboard shortcuts
  useAppNavigation(applications, jobId)

  function handleDeleteApplication(id: string) {
    handleDelete(id, function () {
      navigateAfterDelete(id)
    })
  }

  function handleUploadSuccess(newJobId: string) {
    selectApplication(newJobId)
  }

  const hasApplications = applications.length > 0
  const hasActiveJob = !!jobId && !!jobApplication

  return (
    <>
      <AppLayout
        header={
          <AppHeader
            hasActiveJob={hasActiveJob}
            jobId={jobId}
            jobApplication={jobApplication}
            onUploadSuccess={handleUploadSuccess}
          />
        }
        sidebar={
          <Sidebar
            applications={applications}
            selectedId={jobId}
            onSelect={selectApplication}
            collapsed={sidebarCollapsed}
            onEdit={handleUpdate}
            onDelete={handleDeleteApplication}
          />
        }
      >
        {hasActiveJob ? (
          <div className="relative grid h-full grid-cols-8 overflow-hidden">
            <div className={`h-full overflow-hidden ${gridClasses.form}`}>
              <ResumeForm />
            </div>
            <div className={`h-full overflow-hidden ${gridClasses.preview}`}>
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

      <BatchExportButton applications={applications} />

      <Toaster
        position="bottom-right"
        theme={currentTheme}
        icons={{
          success: <CircleCheck size={20} className="text-success" />,
          error: <CircleX size={20} className="text-error" />,
          warning: <CircleAlert size={20} className="text-warning" />,
          info: <Info size={20} className="text-info" />,
        }}
      />
    </>
  )
}
