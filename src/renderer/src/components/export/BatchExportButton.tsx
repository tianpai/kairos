import { Download } from 'lucide-react'
import { Button } from '@ui/Button'
import { useBatchExportModal } from './BatchExportModal'

interface BatchExportButtonProps {
  showArchived: boolean
}

export function BatchExportButton({ showArchived }: BatchExportButtonProps) {
  const { open } = useBatchExportModal()

  return (
    <Button
      onClick={() => open({ showArchived })}
      ariaLabel="Export all resumes"
      title="Export All"
    >
      <Download size={16} />
    </Button>
  )
}
