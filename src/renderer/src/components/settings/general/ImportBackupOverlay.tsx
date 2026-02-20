import { Database } from 'lucide-react'

interface ImportBackupOverlayProps {
  isImportingBackup: boolean
}

export function ImportBackupOverlay({
  isImportingBackup,
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
      </div>
    </div>
  )
}
