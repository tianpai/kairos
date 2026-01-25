import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { create } from 'zustand'
import { toast } from 'sonner'
import { Modal } from '@ui/Modal'
import { Toggle } from '@ui/Toggle'
import { getAllJobApplications, getJobApplication } from '@api/jobs'
import { compileToPDF } from '@typst-compiler/compile'
import type { JobApplication } from '@api/jobs'
import type { TemplateData } from '@templates/template.types'
import { TemplateBuilder } from '@/templates/builder'

interface FailedExportsListProps {
  failed: Array<string>
  title?: string
  className?: string
}

interface ApplicationListItemProps {
  app: JobApplication
  checked: boolean
  onToggle: (id: string) => void
  disabled?: boolean
}

interface ApplicationListProps {
  applications: Array<JobApplication>
  selectedIds: Set<string>
  onToggle: (id: string) => void
  disabled?: boolean
}

interface BatchExportActionsProps {
  exporting: boolean
  hasFailures: boolean
  selectedCount: number
  onClose: () => void
  onExport: () => void
}

interface BatchExportContentProps {
  exporting: boolean
  applications: Array<JobApplication>
  allSelected: boolean
  selectedIds: Set<string>
  failed: Array<string>
  onToggleSelectAll: () => void
  onToggle: (id: string) => void
}

interface BatchExportState {
  isOpen: boolean
}

interface BatchExportActions {
  open: () => void
  close: () => void
}

type BatchExportStore = BatchExportState & BatchExportActions

const useBatchExportStore = create<BatchExportStore>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))

type TemplateSchemas = ReturnType<TemplateBuilder['getSchemas']>

function sanitizeForFilename(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

function generateFilename(
  name: string,
  companyName: string,
  position: string,
): string {
  const sanitizedName = sanitizeForFilename(name || 'resume')
  const sanitizedCompany = sanitizeForFilename(companyName)
  const sanitizedPosition = sanitizeForFilename(position)
  return `${sanitizedName}_${sanitizedCompany}_${sanitizedPosition}.pdf`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function applySchemaDefaults(
  resumeData: TemplateData,
  schemas: TemplateSchemas,
): TemplateData {
  const dataWithDefaults: TemplateData = {}
  for (const [sectionId, rawData] of Object.entries(resumeData)) {
    const schema = schemas[sectionId]
    if (schema && rawData !== undefined) {
      if (Array.isArray(rawData)) {
        dataWithDefaults[sectionId] = rawData.map((item) => schema.parse(item))
      } else {
        dataWithDefaults[sectionId] = schema.parse(rawData)
      }
    } else {
      dataWithDefaults[sectionId] = rawData
    }
  }
  return dataWithDefaults
}

async function exportApplication(
  app: JobApplication,
  folderPath: string,
): Promise<string | null> {
  try {
    const details = await getJobApplication(app.id)
    const resumeData = details.tailoredResume || details.parsedResume
    if (!resumeData) {
      return `${app.companyName} - ${app.position} (no resume data)`
    }

    const builder = new TemplateBuilder(details.templateId)
    const dataWithDefaults = applySchemaDefaults(
      resumeData as TemplateData,
      builder.getSchemas(),
    )

    const typstCode = builder.build(dataWithDefaults)
    const pdfBinary = await compileToPDF(typstCode)

    const personalInfo = resumeData.personalInfo as
      | { name?: string }
      | undefined
    const name = personalInfo?.name?.trim() || 'resume'
    const filename = generateFilename(name, app.companyName, app.position)

    await window.kairos.fs.writeFile(
      folderPath,
      filename,
      new Uint8Array(pdfBinary).buffer,
    )

    return null
  } catch (error) {
    console.error(`Failed to export ${app.companyName}`, error)
    return `${app.companyName} - ${app.position}`
  }
}

function FailedExportsList({
  failed,
  title = 'Failed exports:',
  className = '',
}: FailedExportsListProps) {
  if (failed.length === 0) return null

  return (
    <div className={className}>
      <div className="text-error text-sm font-medium">{title}</div>
      <ul className="text-secondary mt-1 list-inside list-disc text-sm">
        {failed.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function ApplicationListItem({
  app,
  checked,
  onToggle,
  disabled = false,
}: ApplicationListItemProps) {
  return (
    <label
      className={`border-hover flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 ${
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'hover:bg-hover cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(app.id)}
        disabled={disabled}
        className="border-default h-4 w-4 rounded accent-black focus:ring-0 focus:ring-offset-0 dark:accent-white"
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="min-w-0 truncate">
          <span className="text-primary font-medium">{app.companyName}</span>
          <span className="text-hint mx-2">-</span>
          <span className="text-secondary">{app.position}</span>
        </div>
        <span className="text-hint shrink-0 text-sm">
          {app.dueDate ? `Due ${formatDate(app.dueDate)}` : 'No due date'}
        </span>
      </div>
    </label>
  )
}

function ApplicationList({
  applications,
  selectedIds,
  onToggle,
  disabled = false,
}: ApplicationListProps) {
  return (
    <div className="border-default max-h-96 overflow-y-auto rounded border">
      {applications.length === 0 ? (
        <div className="text-hint p-4 text-center">
          No applications match the current filter
        </div>
      ) : (
        applications.map((app) => (
          <ApplicationListItem
            key={app.id}
            app={app}
            checked={selectedIds.has(app.id)}
            onToggle={onToggle}
            disabled={disabled}
          />
        ))
      )}
    </div>
  )
}

function BatchExportActions({
  exporting,
  hasFailures,
  selectedCount,
  onClose,
  onExport,
}: BatchExportActionsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onClose}
        disabled={exporting}
        className="text-secondary hover:bg-hover cursor-pointer rounded px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {hasFailures ? 'Close' : 'Cancel'}
      </button>
      <button
        onClick={onExport}
        disabled={selectedCount === 0 || exporting}
        className="bg-primary hover:bg-primary/90 cursor-pointer rounded px-4 py-2 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exporting
          ? 'Exporting...'
          : `Export ${selectedCount} PDF${selectedCount !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}

function BatchExportContent({
  exporting,
  applications,
  allSelected,
  selectedIds,
  failed,
  onToggleSelectAll,
  onToggle,
}: BatchExportContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-primary text-xl font-semibold">Export PDFs</h2>

      <Toggle
        checked={!allSelected}
        onChange={onToggleSelectAll}
        labelOff="Select All"
        labelOn="Select None"
        disabled={exporting}
      />
      <ApplicationList
        applications={applications}
        selectedIds={selectedIds}
        onToggle={onToggle}
        disabled={exporting}
      />
      {failed.length ? (
        <FailedExportsList
          failed={failed}
          title="Some exports failed:"
          className="mt-2"
        />
      ) : null}
    </div>
  )
}

export function BatchExportModal() {
  const { data: applications = [] } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: getAllJobApplications,
  })

  const isOpen = useBatchExportStore((state) => state.isOpen)
  const close = useBatchExportStore((state) => state.close)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [failed, setFailed] = useState<Array<string>>([])

  const resetState = useCallback(() => {
    setSelectedIds(new Set())
    setFailed([])
  }, [])

  const allSelected = useMemo(() => {
    return (
      applications.length > 0 &&
      applications.every((app) => selectedIds.has(app.id))
    )
  }, [applications, selectedIds])

  const handleToggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(applications.map((app) => app.id)))
    }
  }, [allSelected, applications])

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleExport = useCallback(async () => {
    if (selectedIds.size === 0) return

    const folderPath = await window.kairos.dialog.selectFolder()
    if (!folderPath) return

    setExporting(true)
    setFailed([])
    const selectedApps = applications.filter((app) => selectedIds.has(app.id))
    const failedExports: Array<string> = []

    for (const app of selectedApps) {
      const failure = await exportApplication(app, folderPath)
      if (failure) {
        failedExports.push(failure)
      }
    }

    setExporting(false)
    setFailed(failedExports)

    const succeeded = selectedApps.length - failedExports.length
    if (succeeded === selectedApps.length) {
      toast.success(`Exported ${succeeded} PDF${succeeded > 1 ? 's' : ''}`)
      resetState()
      close()
    } else if (succeeded > 0) {
      toast.warning(`Exported ${succeeded} of ${selectedApps.length} PDFs`, {
        description: `${failedExports.length} failed to export`,
      })
    } else {
      toast.error('Failed to export PDFs')
    }
  }, [selectedIds, applications, close, resetState])

  const handleClose = useCallback(() => {
    if (!exporting) {
      resetState()
      close()
    }
  }, [exporting, close, resetState])

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      size="2xl"
      closeOnBackdropClick={!exporting}
      actions={
        <BatchExportActions
          exporting={exporting}
          hasFailures={failed.length > 0}
          selectedCount={selectedIds.size}
          onClose={handleClose}
          onExport={handleExport}
        />
      }
    >
      <BatchExportContent
        exporting={exporting}
        applications={applications}
        allSelected={allSelected}
        selectedIds={selectedIds}
        failed={failed}
        onToggleSelectAll={handleToggleSelectAll}
        onToggle={handleToggle}
      />
    </Modal>
  )
}

export function useBatchExportModal() {
  const open = useBatchExportStore((state) => state.open)
  return { open, Modal: BatchExportModal }
}
