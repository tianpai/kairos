import { useCallback, useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@ui/Button'
import {
  exportWithDestinationPicker,
  showExportToast,
  useExportModal,
} from './ExportModal'
import type { ExportTarget } from './ExportModal'

interface ExportButtonProps {
  showArchived?: boolean
  targets?: ExportTarget[]
}

export function ExportButton({
  showArchived = false,
  targets,
}: ExportButtonProps) {
  const { open } = useExportModal()
  const [exporting, setExporting] = useState(false)

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
      toast.error(
        targets.length > 1 ? 'Failed to export PDFs' : 'Failed to export PDF',
      )
    } finally {
      setExporting(false)
    }
  }, [open, showArchived, targets])

  const targetCount = targets?.length ?? 0
  const ariaLabel =
    targetCount > 1 ? 'Export resumes as PDF' : 'Export resume as PDF'

  return (
    <Button
      onClick={() => void handleExport()}
      loading={exporting}
      ariaLabel={ariaLabel}
      tooltip="Export"
    >
      <Download size={16} />
    </Button>
  )
}
