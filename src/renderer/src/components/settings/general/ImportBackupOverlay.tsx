import { Database } from 'lucide-react'
import type { BackupImportProgress } from '../../../../../shared/backup'

interface ImportBackupOverlayProps {
  isImportingBackup: boolean
  importProgress: BackupImportProgress | null
}

export function ImportBackupOverlay({
  isImportingBackup,
  importProgress,
}: ImportBackupOverlayProps) {
  if (!isImportingBackup) {
    return null
  }

  return (
    <div className="bg-base/85 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="border-default bg-base w-full max-w-md rounded-xl border p-6 shadow-lg">
        <div className="flex items-center gap-2">
          <Database size={18} />
          <h3 className="text-base font-semibold">Importing Backup</h3>
        </div>

        <p className="text-secondary mt-2 text-sm">
          Please wait. Do not close the app while data is being restored.
        </p>

        <div className="mt-4 space-y-1">
          <p className="text-hint text-sm">
            {importProgress?.message ?? 'Restoring data...'}{' '}
            {importProgress?.percent ?? 0}%
          </p>
          <div className="bg-hover h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-warning h-full transition-all"
              style={{ width: `${importProgress?.percent ?? 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
