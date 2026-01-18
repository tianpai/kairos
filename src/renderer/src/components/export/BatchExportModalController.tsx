import { useQuery } from '@tanstack/react-query'
import { getAllJobApplications } from '@api/jobs'
import { BatchExportModal } from './BatchExportModal'
import { useBatchExportStore } from './batchExport.store'

export function BatchExportModalController() {
  const { data: applications = [] } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: getAllJobApplications,
  })

  const isOpen = useBatchExportStore((state) => state.isOpen)
  const close = useBatchExportStore((state) => state.close)

  return (
    <BatchExportModal
      open={isOpen}
      onClose={close}
      applications={applications}
    />
  )
}
