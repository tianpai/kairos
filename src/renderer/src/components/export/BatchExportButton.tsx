import { Download } from 'lucide-react'
import { Button } from '@ui/Button'
import { useBatchExportModal } from './BatchExportModal'

export function BatchExportButton() {
  const { open } = useBatchExportModal()

  return (
    <Button onClick={open} ariaLabel="Export all resumes" title="Export All">
      <Download size={16} />
    </Button>
  )
}
