import { useEffect } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '@ui/Button'
import { useShortcutStore } from '@layout/shortcut.store'
import { BatchExportModal } from './BatchExportModal'
import { useBatchExportStore } from './batchExport.store'
import type { JobApplication } from '@api/jobs'

interface BatchExportButtonProps {
  applications: Array<JobApplication>
}

export function BatchExportButton({ applications }: BatchExportButtonProps) {
  const isOpen = useBatchExportStore((state) => state.isOpen)
  const open = useBatchExportStore((state) => state.open)
  const close = useBatchExportStore((state) => state.close)

  const batchExportRequested = useShortcutStore(
    (state) => state.batchExportRequested,
  )
  const clearBatchExportRequest = useShortcutStore(
    (state) => state.clearBatchExportRequest,
  )

  useEffect(() => {
    if (batchExportRequested) {
      open()
      clearBatchExportRequest()
    }
  }, [batchExportRequested, clearBatchExportRequest, open])

  return (
    <>
      <Button onClick={open} title="Export multiple PDFs">
        <FolderOpen size={16} />
      </Button>

      <BatchExportModal
        open={isOpen}
        onClose={close}
        applications={applications}
      />
    </>
  )
}
