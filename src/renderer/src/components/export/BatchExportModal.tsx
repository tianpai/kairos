import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@ui/Modal'
import { Toggle } from '@ui/Toggle'
import { getJobApplication } from '@api/jobs'
import { compileToPDF } from '@typst-compiler/compile'
import type { JobApplication } from '@api/jobs'
import type { TemplateData } from '@templates/template.types'
import { TemplateBuilder } from '@/templates/builder'

interface ExportProgress {
  current: number
  total: number
  currentApp: string
  failed: Array<string>
}

interface BatchExportModalProps {
  open: boolean
  onClose: () => void
  applications: Array<JobApplication>
}

interface FailedExportsListProps {
  failed: Array<string>
  title?: string
  className?: string
}

interface ExportProgressViewProps {
  progress: ExportProgress
}

interface ApplicationListItemProps {
  app: JobApplication
  checked: boolean
  onToggle: (id: string) => void
}

interface ApplicationListProps {
  applications: Array<JobApplication>
  selectedIds: Set<string>
  onToggle: (id: string) => void
}

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

function ExportProgressView({ progress }: ExportProgressViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-secondary text-sm">
        Exporting {progress.current} of {progress.total}...
      </div>
      {progress.currentApp && (
        <div className="text-hint text-sm">{progress.currentApp}</div>
      )}
      <FailedExportsList failed={progress.failed} className="mt-2" />
    </div>
  )
}

function ApplicationListItem({
  app,
  checked,
  onToggle,
}: ApplicationListItemProps) {
  return (
    <label className="border-hover hover:bg-hover flex cursor-pointer items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(app.id)}
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
          />
        ))
      )}
    </div>
  )
}

export function BatchExportModal({
  open,
  onClose,
  applications,
}: BatchExportModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)

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
    const selectedApps = applications.filter((app) => selectedIds.has(app.id))
    const failed: Array<string> = []

    setProgress({
      current: 0,
      total: selectedApps.length,
      currentApp: '',
      failed: [],
    })

    for (let i = 0; i < selectedApps.length; i++) {
      const app = selectedApps[i]
      setProgress({
        current: i,
        total: selectedApps.length,
        currentApp: `${app.companyName} - ${app.position}`,
        failed,
      })

      try {
        const details = await getJobApplication(app.id)
        const resumeData = details.tailoredResume || details.parsedResume
        if (!resumeData) {
          failed.push(`${app.companyName} - ${app.position} (no resume data)`)
          continue
        }

        const builder = new TemplateBuilder(details.templateId)
        const schemas = builder.getSchemas()

        // Apply schema defaults to fill in missing UI formatting fields
        const dataWithDefaults: TemplateData = {}
        for (const [sectionId, rawData] of Object.entries(resumeData)) {
          const schema = schemas[sectionId]
          if (schema && rawData !== undefined) {
            if (Array.isArray(rawData)) {
              dataWithDefaults[sectionId] = rawData.map((item) =>
                schema.parse(item),
              )
            } else {
              dataWithDefaults[sectionId] = schema.parse(rawData)
            }
          } else {
            dataWithDefaults[sectionId] = rawData
          }
        }

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
      } catch (error) {
        console.error(`Failed to export ${app.companyName}`, error)
        failed.push(`${app.companyName} - ${app.position}`)
      }
    }

    setProgress({
      current: selectedApps.length,
      total: selectedApps.length,
      currentApp: '',
      failed,
    })

    setExporting(false)

    const succeeded = selectedApps.length - failed.length
    if (succeeded === selectedApps.length) {
      toast.success(`Exported ${succeeded} PDF${succeeded > 1 ? 's' : ''}`)
      onClose()
    } else if (succeeded > 0) {
      toast.warning(`Exported ${succeeded} of ${selectedApps.length} PDFs`, {
        description: `${failed.length} failed to export`,
      })
    } else {
      toast.error('Failed to export PDFs')
    }
  }, [selectedIds, applications, onClose])

  const handleClose = useCallback(() => {
    if (!exporting) {
      setSelectedIds(new Set())
      setProgress(null)
      onClose()
    }
  }, [exporting, onClose])

  return (
    <Modal
      open={open}
      onClose={handleClose}
      variant="popup"
      maxWidth="2xl"
      closeOnBackdropClick={!exporting}
      actions={
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            disabled={exporting}
            className="text-secondary hover:bg-hover cursor-pointer rounded px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {progress?.failed.length ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleExport}
            disabled={selectedIds.size === 0 || exporting}
            className="bg-primary hover:bg-primary/90 cursor-pointer rounded px-4 py-2 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting
              ? 'Exporting...'
              : `Export ${selectedIds.size} PDF${selectedIds.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-primary text-xl font-semibold">Export PDFs</h2>

        {exporting && progress ? (
          <ExportProgressView progress={progress} />
        ) : (
          <>
            <Toggle
              checked={!allSelected}
              onChange={handleToggleSelectAll}
              labelOff="Select All"
              labelOn="Select None"
            />
            <ApplicationList
              applications={applications}
              selectedIds={selectedIds}
              onToggle={handleToggle}
            />
            {progress?.failed.length ? (
              <FailedExportsList
                failed={progress.failed}
                title="Some exports failed:"
                className="mt-2"
              />
            ) : null}
          </>
        )}
      </div>
    </Modal>
  )
}
