import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { getAllJobApplications } from '@api/jobs'
import { AppLayout } from '@layout/AppLayout'
import { PageHeader } from '@ui/PageHeader'
import { useJobApplicationMutations } from '@hooks/useJobApplicationMutations'
import { Search, X } from 'lucide-react'
import { ApplicationCard } from './ApplicationCard'
import type { JobApplication } from '@api/jobs'
import JobInfoModal from '@/components/applications/JobInfoModal'
import NewApplicationButton from '@/components/upload/NewApplicationButton'
import { BatchExportButton } from '@/components/export/BatchExportButton'
import { SettingsButton } from '@/components/settings/SettingsButton'

interface OpeningApp {
  id: string
  originX: number
  originY: number
}

function ApplicationPageHeader() {
  return (
    <PageHeader
      left={<NewApplicationButton />}
      center={<span>All Applications</span>}
      right={
        <>
          <SettingsButton />
          <BatchExportButton />
        </>
      }
    />
  )
}

function EmptyStage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-hint text-center text-sm">
        No applications yet. Create your first application to get started.
      </div>
    </div>
  )
}

function SearchInput({
  value,
  onChange,
  onClear,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ignore if user is already in an input, or pressing modifier keys
      if (e.target instanceof HTMLInputElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.length !== 1) return // filters out Enter, Escape, arrows, etc.

      inputRef.current?.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="border-default focus-within:border-primary flex w-110 items-center gap-2 rounded-2xl border px-3 py-1.5">
      <Search className="text-hint size-3.5 shrink-0" />
      <input
        type="text"
        value={value}
        ref={inputRef}
        onChange={onChange}
        placeholder="Type directly or click here to search applications..."
        className="text-primary placeholder:text-hint w-full bg-transparent text-sm outline-none"
      />
      {value && (
        <button onClick={onClear}>
          <X className="text-hint hover:text-primary size-3.5 shrink-0" />
        </button>
      )}
    </div>
  )
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
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null)
  const isOpening = !!openingApp

  // searching
  const [search, setSearch] = useState('')
  const filtered = applications.filter((app) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      app.companyName.toLowerCase().includes(q) ||
      app.position.toLowerCase().includes(q)
    )
  })

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
    navigate({ to: '/editor', search: { jobId: openingApp.id } })
  }

  if (applications.length === 0) {
    return (
      <AppLayout header={<ApplicationPageHeader />}>
        <EmptyStage />
      </AppLayout>
    )
  }

  return (
    <AppLayout header={<ApplicationPageHeader />}>
      <div className="relative flex h-full flex-col gap-5 overflow-auto px-10 py-5">
        <div className="flex justify-center">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>
        {search && filtered.length == 0 ? (
          <div className="text-hint text-center">
            You didn't apply there... yet
          </div>
        ) : (
          <div
            style={{ gridTemplateColumns: 'repeat(auto-fill, 220px)' }}
            className={`grid justify-center gap-5 ${isOpening ? 'pointer-events-none' : ''}`}
          >
            {filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                isExpanded={expandedAppId === app.id}
                onToggleExpand={() =>
                  setExpandedAppId(expandedAppId === app.id ? null : app.id)
                }
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
