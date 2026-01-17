import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, GalleryVerticalEnd } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { getAllJobApplications } from '@api/jobs'
import { AppLayout } from '@layout/AppLayout'
import { PageHeader } from '@ui/PageHeader'
import { Button } from '@ui/Button'
import { useJobApplicationMutations } from '@hooks/useJobApplicationMutations'
import { ApplicationCard } from './ApplicationCard'
import type { JobApplication } from '@api/jobs'
import JobInfoModal from '@/components/applications/JobInfoModal'
import NewApplicationButton from '@/components/upload/NewApplicationButton'

interface OpeningApp {
  id: string
  originX: number
  originY: number
}

export default function AllApplicationsPage() {
  const navigate = useNavigate()

  const { data: applications = [] } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: getAllJobApplications,
  })

  const { handleUpdate, handleDelete } = useJobApplicationMutations()

  const [openingApp, setOpeningApp] = useState<OpeningApp | null>(null)
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null)

  const isOpening = !!openingApp

  function handleOpenCard(app: JobApplication, element: HTMLElement) {
    if (openingApp) return
    const rect = element.getBoundingClientRect()
    setOpeningApp({
      id: app.id,
      originX: rect.left + rect.width / 2,
      originY: rect.top + rect.height / 2,
    })
  }

  function handleSaveEdit(data: {
    companyName: string
    position: string
    dueDate: string
    jobUrl: string | null
  }) {
    if (!editingApp) return
    handleUpdate(editingApp.id, data)
    setEditingApp(null)
  }

  function handleDeleteFromModal() {
    if (!editingApp) return
    handleDelete(editingApp.id)
    setEditingApp(null)
  }

  function handleOpenComplete() {
    if (!openingApp) return
    navigate({ to: '/', search: { jobId: openingApp.id } })
  }

  function handleBackToEditor() {
    navigate({ to: '/', search: { jobId: undefined } })
  }

  return (
    <AppLayout
      header={
        <PageHeader
          left={
            <>
              <Button
                onClick={handleBackToEditor}
                ariaLabel="Back to editor"
                title="Back"
              >
                <ArrowLeft size={16} />
              </Button>
              <NewApplicationButton />
            </>
          }
          center={
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <GalleryVerticalEnd size={16} />
              <span>All Applications</span>
            </div>
          }
        />
      }
      sidebar={null}
    >
      <div className="relative h-full overflow-auto px-15 py-5">
        {applications.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-hint text-center text-sm">
              No applications yet. Create your first application to get started.
            </div>
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${isOpening ? 'pointer-events-none' : ''}`}
          >
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onOpen={handleOpenCard}
                onEdit={setEditingApp}
                disabled={isOpening}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {openingApp && (
          <motion.div
            className="bg-base fixed inset-0 z-50"
            style={{
              transformOrigin: `${openingApp.originX}px ${openingApp.originY}px`,
            }}
            initial={{ opacity: 0.6, scale: 0.98, borderRadius: 24 }}
            animate={{ opacity: 1, scale: 1, borderRadius: 0 }}
            transition={{
              duration: 0.28,
              ease: [0.16, 0.84, 0.44, 1] as const,
            }}
            onAnimationComplete={handleOpenComplete}
          />
        )}
      </AnimatePresence>
      {editingApp && (
        <JobInfoModal
          open={true}
          onClose={() => setEditingApp(null)}
          onSave={handleSaveEdit}
          onDelete={handleDeleteFromModal}
          initialData={{
            companyName: editingApp.companyName,
            position: editingApp.position,
            dueDate: editingApp.dueDate,
            jobUrl: editingApp.jobUrl,
          }}
        />
      )}
    </AppLayout>
  )
}
