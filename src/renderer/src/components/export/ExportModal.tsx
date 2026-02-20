import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { create } from 'zustand'
import { toast } from 'sonner'
import { Modal } from '@ui/Modal'
import { Toggle } from '@ui/Toggle'
import {
  getAllJobApplications,
  getArchivedJobApplications,
  getJobApplication,
} from '@api/jobs'
import { compileToPDF } from '@typst-compiler/compile'
import { formatDate } from '@utils/format'
import type { JobApplication } from '@api/jobs'
import type { TemplateData } from '@templates/template.types'
import { TemplateBuilder } from '@/templates/builder'

export interface ExportTarget {
  id: string
  companyName: string
  position: string
}

export interface ExportSummary {
  total: number
  succeeded: number
  failed: Array<string>
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

interface ExportActionsProps {
  exporting: boolean
  selectedCount: number
  onClose: () => void
  onExport: () => void
}

interface ExportContentProps {
  exporting: boolean
  applications: Array<JobApplication>
  allSelected: boolean
  selectedIds: Set<string>
  onToggleSelectAll: () => void
  onToggle: (id: string) => void
}

interface ExportState {
  isOpen: boolean
  showArchived: boolean
}

interface ExportOpenOptions {
  showArchived?: boolean
}

interface ExportStoreActions {
  open: (options?: ExportOpenOptions) => void
  close: () => void
  setShowArchivedMode: (showArchived: boolean) => void
}

type ExportStore = ExportState & ExportStoreActions

const useExportStore = create<ExportStore>()((set) => ({
  isOpen: false,
  showArchived: false,
  open: (options) =>
    set((state) => ({
      isOpen: true,
      showArchived: options?.showArchived ?? state.showArchived,
    })),
  close: () => set({ isOpen: false }),
  setShowArchivedMode: (showArchived) => set({ showArchived }),
}))

function sanitizeText(str: string): string {
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
  const sanitizedName = sanitizeText(name || 'resume')
  const sanitizedCompany = sanitizeText(companyName)
  const sanitizedPosition = sanitizeText(position)
  return `${sanitizedName}_${sanitizedCompany}_${sanitizedPosition}.pdf`
}

type TemplateSchemas = ReturnType<TemplateBuilder['getSchemas']>

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

function getApplicationLabel(companyName: string, position: string): string {
  return `${companyName} - ${position}`
}

async function exportApplication(
  target: ExportTarget,
  folderPath: string,
): Promise<string | null> {
  const label = getApplicationLabel(target.companyName, target.position)

  try {
    const details = await getJobApplication(target.id)
    const resumeData = details.tailoredResume || details.parsedResume
    if (!resumeData) {
      return `${label} (no resume data)`
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
    const filename = generateFilename(
      name,
      details.companyName,
      details.position,
    )

    await window.kairos.fs.writeFile(
      folderPath,
      filename,
      new Uint8Array(pdfBinary).buffer,
    )
    return null
  } catch (error) {
    console.error(`Failed to export ${label}`, error)
    return label
  }
}

export async function exportApplicationsToFolder(
  targets: Array<ExportTarget>,
  folderPath: string,
): Promise<ExportSummary> {
  const failedExports: Array<string> = []

  for (const target of targets) {
    const failure = await exportApplication(target, folderPath)
    if (failure) {
      failedExports.push(failure)
    }
  }

  return {
    total: targets.length,
    succeeded: targets.length - failedExports.length,
    failed: failedExports,
  }
}

export function showExportToast(summary: ExportSummary): void {
  if (summary.succeeded === summary.total) {
    toast.success(
      `Exported ${summary.succeeded} PDF${summary.succeeded > 1 ? 's' : ''}`,
    )
    return
  }

  if (summary.succeeded > 0) {
    toast.warning(`Exported ${summary.succeeded} of ${summary.total} PDFs`, {
      description: `${summary.failed.length} failed to export`,
    })
    return
  }
  toast.error(
    summary.total > 1 ? 'Failed to export PDFs' : 'Failed to export PDF',
  )
}

export async function exportWithDestinationPicker(
  targets: Array<ExportTarget>,
): Promise<ExportSummary | null> {
  if (targets.length === 0) return null

  const folderPath = await window.kairos.dialog.selectFolder()
  if (!folderPath) return null

  return exportApplicationsToFolder(targets, folderPath)
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
          {app.dueDate
            ? `Due ${formatDate(app.dueDate, {
                format: { month: 'short', day: 'numeric' },
              })}`
            : 'No due date'}
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

function ExportActions({
  exporting,
  selectedCount,
  onClose,
  onExport,
}: ExportActionsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onClose}
        disabled={exporting}
        className="text-secondary hover:bg-hover cursor-pointer rounded px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
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

function ExportContent({
  exporting,
  applications,
  allSelected,
  selectedIds,
  onToggleSelectAll,
  onToggle,
}: ExportContentProps) {
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
    </div>
  )
}

export function ExportModal() {
  const isOpen = useExportStore((state) => state.isOpen)
  const showArchived = useExportStore((state) => state.showArchived)

  const { data: applications = [] } = useQuery({
    queryKey: showArchived ? ['archivedJobApplications'] : ['jobApplications'],
    queryFn: showArchived ? getArchivedJobApplications : getAllJobApplications,
    enabled: isOpen,
  })

  const close = useExportStore((state) => state.close)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  const resetState = useCallback(() => {
    setSelectedIds(new Set())
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

    setExporting(true)
    try {
      const selectedTargets = applications
        .filter((app) => selectedIds.has(app.id))
        .map((app) => ({
          id: app.id,
          companyName: app.companyName,
          position: app.position,
        }))
      const summary = await exportWithDestinationPicker(selectedTargets)
      if (!summary) return

      showExportToast(summary)

      if (summary.succeeded === summary.total) {
        resetState()
        close()
      }
    } catch (error) {
      console.error('Failed to export PDFs', error)
      toast.error('Failed to export PDFs')
    } finally {
      setExporting(false)
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
        <ExportActions
          exporting={exporting}
          selectedCount={selectedIds.size}
          onClose={handleClose}
          onExport={handleExport}
        />
      }
    >
      <ExportContent
        exporting={exporting}
        applications={applications}
        allSelected={allSelected}
        selectedIds={selectedIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggle={handleToggle}
      />
    </Modal>
  )
}

export function useExportModal() {
  const open = useExportStore((state) => state.open)
  const setShowArchivedMode = useExportStore(
    (state) => state.setShowArchivedMode,
  )
  return { open, setShowArchivedMode, Modal: ExportModal }
}
