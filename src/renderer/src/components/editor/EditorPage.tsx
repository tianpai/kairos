import { useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getAllJobApplications, getJobApplication } from '@api/jobs'
import { useWorkflowSync } from '@hooks/useWorkflowSync'
import { useSyncJobApplicationToStore } from '@hooks/useSyncJobApplicationToStore'
import { useAppNavigation } from '@hooks/useAppNavigation'
import ResumeRender from '@editor/ResumeRender'
import ResumeForm from '@resumeForm/ResumeForm'
import Checklist from '@checklist/Checklist'
import { AppLayout } from '@layout/AppLayout'
import { EditorHeader } from './EditorHeader'
import { useLayoutStore } from '@layout/layout.store'

export default function EditorPage() {
  const { jobId } = useSearch({ from: '/editor' })

  // Layout state from store
  const { showChecklist } = useLayoutStore()

  // Grid layout classes
  const gridClasses = {
    form: showChecklist ? 'col-span-2' : 'col-span-3',
    preview: showChecklist ? 'col-span-4' : 'col-span-5',
  }

  // Fetch all applications
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

  // Sync workflow state between DB and store
  useWorkflowSync(jobId, jobApplication)

  // Sync job application data to store (templateId + tailored resume)
  useSyncJobApplicationToStore(jobApplication)

  // Handle keyboard shortcuts
  useAppNavigation(applications, jobId)

  return (
    <AppLayout
      header={
        <EditorHeader
          jobId={jobId}
          jobApplication={jobApplication}
        />
      }
      sidebar={null}
    >
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
    </AppLayout>
  )
}
