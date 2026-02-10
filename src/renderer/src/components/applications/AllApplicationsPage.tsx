import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  getAllJobApplications,
  getArchivedJobApplications,
  toggleArchive,
  togglePin,
} from '@api/jobs'
import { AppLayout } from '@layout/AppLayout'
import { PageHeader } from '@ui/PageHeader'
import { useJobApplicationMutations } from '@hooks/useJobApplicationMutations'
import { Archive, Search, X } from 'lucide-react'
import { ApplicationCard } from './ApplicationCard'
import type { JobApplication } from '@api/jobs'
import JobInfoModal from '@/components/applications/JobInfoModal'
import { useBatchExportModal } from '@/components/export/BatchExportModal'
import NewApplicationButton from '@/components/upload/NewApplicationButton'
import { BatchExportButton } from '@/components/export/BatchExportButton'
import { SettingsButton } from '@/components/settings/SettingsButton'

interface OpeningApp {
  id: string
  originX: number
  originY: number
}

function ApplicationPageHeader({ showArchived }: { showArchived: boolean }) {
  return (
    <PageHeader
      left={<NewApplicationButton />}
      center={<span>All Applications</span>}
      right={
        <>
          <SettingsButton />
          <BatchExportButton showArchived={showArchived} />
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

function ApplicationsGrid({
  pinnedApplications,
  otherApplications,
  hasPinnedApplications,
  expandedAppId,
  isArchived,
  onToggleExpand,
  onOpen,
  onEdit,
  onPin,
  onArchive,
  disabled,
}: {
  pinnedApplications: Array<JobApplication>
  otherApplications: Array<JobApplication>
  hasPinnedApplications: boolean
  expandedAppId: string | null
  isArchived: boolean
  onToggleExpand: (id: string) => void
  onOpen: (app: JobApplication, element: HTMLElement) => void
  onEdit: (app: JobApplication) => void
  onPin: (args: { id: string; pinned: boolean }) => void
  onArchive: (id: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-5">
      <ApplicationsSection
        title={hasPinnedApplications ? 'Pinned' : undefined}
        applications={pinnedApplications}
        expandedAppId={expandedAppId}
        isArchived={isArchived}
        onToggleExpand={onToggleExpand}
        onOpen={onOpen}
        onEdit={onEdit}
        onPin={(id) => onPin({ id, pinned: false })}
        onArchive={onArchive}
        disabled={disabled}
      />
      <ApplicationsSection
        title={hasPinnedApplications ? 'Others' : undefined}
        applications={otherApplications}
        expandedAppId={expandedAppId}
        isArchived={isArchived}
        onToggleExpand={onToggleExpand}
        onOpen={onOpen}
        onEdit={onEdit}
        onPin={(id) => onPin({ id, pinned: true })}
        onArchive={onArchive}
        disabled={disabled}
      />
    </div>
  )
}

function ApplicationToolbar({
  search,
  onSearchChange,
  onSearchClear,
  showArchived,
  onArchiveToggle,
}: {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSearchClear: () => void
  showArchived: boolean
  onArchiveToggle: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        onClear={onSearchClear}
      />
      <ArchiveToggle active={showArchived} onClick={onArchiveToggle} />
    </div>
  )
}

function ArchiveToggle({
  active,
  onClick,
}: {
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={
        active ? 'Show active applications' : 'Show archived applications'
      }
      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 transition-colors ${
        active
          ? 'border-primary bg-hover text-primary'
          : 'border-default text-hint hover:text-primary'
      }`}
    >
      <Archive size={14} />
      <span className="text-xs">Archive</span>
    </button>
  )
}

interface ApplicationsSectionProps {
  title?: string
  applications: Array<JobApplication>
  expandedAppId: string | null
  isArchived: boolean
  onToggleExpand: (id: string) => void
  onOpen: (app: JobApplication, element: HTMLElement) => void
  onEdit: (app: JobApplication) => void
  onPin: (id: string) => void
  onArchive: (id: string) => void
  disabled: boolean
}

function ApplicationsSection({
  title,
  applications,
  expandedAppId,
  isArchived,
  onToggleExpand,
  onOpen,
  onEdit,
  onPin,
  onArchive,
  disabled,
}: ApplicationsSectionProps) {
  if (applications.length === 0) return null

  return (
    <div
      style={{ gridTemplateColumns: 'repeat(auto-fill, 220px)' }}
      className={`grid justify-center gap-5 ${disabled ? 'pointer-events-none' : ''}`}
    >
      {title && (
        <div
          style={{ gridColumn: '1 / -1' }}
          className="text-hint text-xs font-medium tracking-wide uppercase"
        >
          {title}
        </div>
      )}
      {applications.map((app) => (
        <ApplicationCard
          key={app.id}
          application={app}
          isExpanded={expandedAppId === app.id}
          isArchived={isArchived}
          onToggleExpand={() => onToggleExpand(app.id)}
          onOpen={onOpen}
          onEdit={onEdit}
          onPin={onPin}
          onArchive={onArchive}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

export default function AllApplicationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handleUpdate, handleDelete } = useJobApplicationMutations()
  const { setShowArchivedMode } = useBatchExportModal()

  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    setShowArchivedMode(showArchived)
  }, [showArchived, setShowArchivedMode])

  const { data: applications = [] } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: getAllJobApplications,
    enabled: !showArchived,
  })

  const { data: archivedApplications = [] } = useQuery({
    queryKey: ['archivedJobApplications'],
    queryFn: getArchivedJobApplications,
    enabled: showArchived,
  })

  const displayedApplications = showArchived
    ? archivedApplications
    : applications

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      togglePin(id, pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      queryClient.invalidateQueries({
        queryKey: ['archivedJobApplications'],
      })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => toggleArchive(id, !showArchived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      queryClient.invalidateQueries({
        queryKey: ['archivedJobApplications'],
      })
    },
  })

  const [openingApp, setOpeningApp] = useState<OpeningApp | null>(null)
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null)
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null)
  const isOpening = !!openingApp

  // searching
  const [search, setSearch] = useState('')
  const filtered = displayedApplications.filter((app) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      app.companyName.toLowerCase().includes(q) ||
      app.position.toLowerCase().includes(q)
    )
  })
  const pinnedApplications = filtered.filter((app) => app.pinned === 1)
  const otherApplications = filtered.filter((app) => app.pinned !== 1)
  const hasPinnedApplications = pinnedApplications.length > 0

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

  function handleToggleExpand(id: string) {
    setExpandedAppId((current) => (current === id ? null : id))
  }

  return (
    <AppLayout header={<ApplicationPageHeader showArchived={showArchived} />}>
      <div className="relative flex h-full flex-col gap-5 overflow-auto px-10 py-5">
        <ApplicationToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          onSearchClear={() => setSearch('')}
          showArchived={showArchived}
          onArchiveToggle={() => {
            setShowArchived((prev) => !prev)
            setSearch('')
            setExpandedAppId(null)
          }}
        />
        {!showArchived && applications.length === 0 ? (
          <EmptyStage />
        ) : showArchived && displayedApplications.length === 0 ? (
          <div className="text-hint text-center">No archived applications</div>
        ) : search && filtered.length === 0 ? (
          <div className="text-hint text-center">
            You didn't apply there... yet
          </div>
        ) : (
          <ApplicationsGrid
            pinnedApplications={pinnedApplications}
            otherApplications={otherApplications}
            hasPinnedApplications={hasPinnedApplications}
            expandedAppId={expandedAppId}
            isArchived={showArchived}
            onToggleExpand={handleToggleExpand}
            onOpen={handleOpenCard}
            onEdit={setEditingApp}
            onPin={pinMutation.mutate}
            onArchive={(id: string) => archiveMutation.mutate(id)}
            disabled={isOpening}
          />
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
