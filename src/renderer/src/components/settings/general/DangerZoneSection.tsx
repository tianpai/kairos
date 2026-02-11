import { HoldButton } from '@ui/HoldButton'

interface DangerZoneSectionProps {
  isDeleting: boolean
  isResetting: boolean
  isExportingBackup: boolean
  isImportingBackup: boolean
  onDeleteAllData: () => Promise<void>
  onResetProviders: () => Promise<void>
}

export function DangerZoneSection({
  isDeleting,
  isResetting,
  isExportingBackup,
  isImportingBackup,
  onDeleteAllData,
  onResetProviders,
}: DangerZoneSectionProps) {
  return (
    <div className="space-y-4">
      <div className="border-error/30 bg-error-subtle/30 rounded-lg border p-4">
        <h3 className="text-error text-sm font-medium">Danger Zone</h3>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-secondary text-sm">
              Delete all job applications and resumes. Provider settings will be
              preserved.
            </p>
            <div className="mt-2">
              <HoldButton
                onComplete={onDeleteAllData}
                disabled={isDeleting || isExportingBackup || isImportingBackup}
                className="text-error hover:bg-error-subtle"
              >
                {isDeleting ? 'Deleting...' : 'Hold to Delete All Data'}
              </HoldButton>
            </div>
          </div>

          <div>
            <p className="text-secondary text-sm">
              Remove all API keys and authentication. You'll need to reconfigure
              providers to use AI features.
            </p>
            <div className="mt-2">
              <HoldButton
                onComplete={onResetProviders}
                disabled={isResetting || isExportingBackup || isImportingBackup}
                className="text-error hover:bg-error-subtle"
              >
                {isResetting
                  ? 'Resetting...'
                  : 'Hold to Reset Provider Settings'}
              </HoldButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
