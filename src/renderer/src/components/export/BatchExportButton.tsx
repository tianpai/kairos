import { FileDown } from 'lucide-react'
import { Button } from '@ui/Button'
import { useBatchExportStore } from './batchExport.store'

export function BatchExportButton() {
  const open = useBatchExportStore((state) => state.open)

  return (
    <Button onClick={open} ariaLabel="Export all resumes" title="Export All">
      <FileDown size={16} />
    </Button>
  )
}
