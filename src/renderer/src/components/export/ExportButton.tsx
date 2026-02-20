import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@ui/Button'
import {
  exportWithDestinationPicker,
  showExportToast,
  useExportModal,
} from './ExportModal'
import type { ExportTarget } from './ExportModal'
import { useShortcutStore } from '@/components/layout/shortcut.store'

interface ExportButtonProps {
  showArchived?: boolean
  targets?: Array<ExportTarget>
  useExportShortcut?: boolean
}

export function ExportButton({
  showArchived = false,
  targets,
  useExportShortcut = false,
}: ExportButtonProps) {
  const { open } = useExportModal()
  const [exporting, setExporting] = useState(false)

  const exportPdfRequested = useShortcutStore((state) => state.exportPdfRequested)
  const clearExportPdfRequest = useShortcutStore(
    (state) => state.clearExportPdfRequest,
  )

  const handleExport = useCallback(async () => {
    const hasTargets = !!targets?.length
    if (!hasTargets) {
      open({ showArchived })
      return
    }

    setExporting(true)
    try {
      const summary = await exportWithDestinationPicker(targets)
      if (summary) {
        showExportToast(summary)
      }
    } catch (error) {
      console.error('Failed to export PDF', error)
      toast.error(targets.length > 1 ? 'Failed to export PDFs' : 'Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }, [open, showArchived, targets])

  useEffect(() => {
    if (!exportPdfRequested) return

    if (useExportShortcut) {
      void handleExport()
    }
    clearExportPdfRequest()
  }, [
    exportPdfRequested,
    useExportShortcut,
    handleExport,
    clearExportPdfRequest,
  ])

  const targetCount = targets?.length ?? 0
  const ariaLabel =
    targetCount > 1 ? 'Export resumes as PDF' : 'Export resume as PDF'

  return (
    <Button
      onClick={() => void handleExport()}
      loading={exporting}
      ariaLabel={ariaLabel}
      title="Export"
    >
      <Download size={16} />
    </Button>
  )
}
