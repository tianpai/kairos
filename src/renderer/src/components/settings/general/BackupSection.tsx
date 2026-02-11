import { Download, Upload } from 'lucide-react'
import { Button } from '@ui/Button'
import type {
  BackupExportProgress,
  BackupImportProgress,
} from '../../../../../shared/backup'

interface BackupSectionProps {
  isExportingBackup: boolean
  isImportingBackup: boolean
  backupProgress: BackupExportProgress | null
  importProgress: BackupImportProgress | null
  onExportBackup: () => Promise<void>
  onImportBackup: () => Promise<void>
}

export function BackupSection({
  isExportingBackup,
  isImportingBackup,
  backupProgress,
  importProgress,
  onExportBackup,
  onImportBackup,
}: BackupSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-secondary text-sm font-medium">Data Backup</h3>
      <p className="text-secondary text-sm">
        Export applications and resume data to a zip backup file.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onExportBackup}
          disabled={isExportingBackup || isImportingBackup}
          variant="outline"
          className="gap-2"
        >
          <Download size={16} />
          {isExportingBackup ? 'Exporting Backup...' : 'Export Backup'}
        </Button>

        <Button
          onClick={onImportBackup}
          disabled={isImportingBackup || isExportingBackup}
          variant="outline"
          className="gap-2"
        >
          <Upload size={16} />
          {isImportingBackup ? 'Importing Backup...' : 'Import Backup'}
        </Button>
      </div>

      {backupProgress && (
        <div className="space-y-1">
          <p className="text-hint text-sm">
            {backupProgress.message} {backupProgress.percent}%
          </p>
          <div className="bg-hover h-1.5 w-full max-w-80 overflow-hidden rounded-full">
            <div
              className="bg-info h-full transition-all"
              style={{ width: `${backupProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {importProgress && (
        <div className="space-y-1">
          <p className="text-hint text-sm">
            {importProgress.message} {importProgress.percent}%
          </p>
          <div className="bg-hover h-1.5 w-full max-w-80 overflow-hidden rounded-full">
            <div
              className="bg-warning h-full transition-all"
              style={{ width: `${importProgress.percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
