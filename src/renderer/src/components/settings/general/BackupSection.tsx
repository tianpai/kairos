import { Download, Upload } from 'lucide-react'
import { Button } from '@ui/Button'

interface BackupSectionProps {
  isExportingBackup: boolean
  isImportingBackup: boolean
  onExportBackup: () => Promise<void>
  onImportBackup: () => Promise<void>
}

export function BackupSection({
  isExportingBackup,
  isImportingBackup,
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
    </div>
  )
}
