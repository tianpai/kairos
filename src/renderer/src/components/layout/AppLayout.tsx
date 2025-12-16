import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Columns2, Columns3, PanelLeft } from 'lucide-react'
import { TailoringButton } from '@editor/TailoringButton'
import { PageHeader } from '@ui/PageHeader'
import { InvertedButton } from '@ui/InvertedButton'
import {
  deleteJobApplication,
  getAllJobApplications,
  getJobApplication,
  updateJobApplication,
} from '@api/jobs'
import { useWorkflowSync } from '@hooks/useWorkflowSync'
import { useSyncJobApplicationToStore } from '@hooks/useSyncJobApplicationToStore'
import { useWorkflowStore } from '@workflow/workflow.store'
import { CHECKLIST_PARSING, RESUME_PARSING } from '@workflow/workflow.types'
import ResumeRender from '@editor/ResumeRender'
import ResumeForm from '@resumeForm/ResumeForm'
import Checklist from '@checklist/Checklist'
import ResumeParsingLoader from '@editor/ResumeParsingLoader'
import DownloadResumeButton from '@editor/DownloadResumeButton'
import SaveResumeButton from '@editor/SaveResumeButton'
import { ManageSectionsButton } from '@resumeForm/ManageSectionsButton'
import { DocumentConfigButton } from '@resumeForm/DocumentConfigButton'
import { EmptyState } from './EmptyState'
import { Sidebar } from './Sidebar'
import { getScoreColor } from '@/utils/scoreThresholds'

const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed'

export default function AppLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { jobId } = useSearch({ from: '/' })

  // Sidebar state (persisted to localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    return saved ? JSON.parse(saved) : false
  })

  // Checklist visibility state
  const [showChecklist, setShowChecklist] = useState(true)

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem(
      SIDEBAR_COLLAPSED_KEY,
      JSON.stringify(sidebarCollapsed),
    )
  }, [sidebarCollapsed])

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
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { companyName: string; position: string; dueDate: string }
    }) => updateJobApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      queryClient.invalidateQueries({ queryKey: ['jobApplication', jobId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteJobApplication,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      // Clear selection if deleted app was selected
      if (deletedId === jobId) {
        navigate({ to: '/', search: { jobId: undefined } })
      }
    },
  })

  // Get loading states from workflow store
  const isParsingResume = useWorkflowStore((state) =>
    state.isTaskRunning(RESUME_PARSING),
  )
  const isParsingChecklist = useWorkflowStore((state) =>
    state.isTaskRunning(CHECKLIST_PARSING),
  )

  // Sync workflow state changes to TanStack Query cache
  useWorkflowSync(jobId)

  // Sync job application data to store (templateId + tailored resume)
  useSyncJobApplicationToStore(jobApplication)

  const handleSelectApplication = (id: string) => {
    navigate({ to: '/', search: { jobId: id } })
  }

  const handleUploadSuccess = (newJobId: string) => {
    navigate({ to: '/', search: { jobId: newJobId } })
  }

  const handleEdit = (
    id: string,
    data: { companyName: string; position: string; dueDate: string },
  ) => {
    updateMutation.mutate({ id, data })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const companyName = jobApplication?.companyName
  const position = jobApplication?.position
  const matchPercentage = jobApplication?.matchPercentage ?? 0
  const isBuiltFromScratch = !jobApplication?.originalResume

  const hasApplications = applications.length > 0
  const hasSelection = !!jobId && !!jobApplication

  return (
    <div className="bg-app-bg flex h-screen flex-col">
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
                onClick={() => setShowChecklist(!showChecklist)}
                ariaLabel={
                  showChecklist ? 'Switch to 2 columns' : 'Switch to 3 columns'
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
              <ManageSectionsButton />
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

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          applications={applications}
          selectedId={jobId}
          onSelect={handleSelectApplication}
          collapsed={sidebarCollapsed}
          onUploadSuccess={handleUploadSuccess}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
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
        </main>
      </div>
    </div>
  )
}
