import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { HoldButton } from '@ui/HoldButton'

export function GeneralSection() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleDeleteAllData = async () => {
    setIsDeleting(true)
    try {
      await window.kairos.jobs.deleteAll()

      // Clear localStorage for application state
      localStorage.removeItem('resume-storage')
      localStorage.removeItem('last-viewed-application')

      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['jobs'] })

      toast.success('All data deleted')

      // Navigate to home
      navigate({ to: '/', search: { jobId: undefined } })
    } catch (error) {
      console.error('Failed to delete all data:', error)
      toast.error('Failed to delete data')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetProviders = async () => {
    setIsResetting(true)
    try {
      await window.kairos.settings.resetAllProviders()

      // Invalidate provider-related queries
      await queryClient.invalidateQueries()

      toast.success('Provider settings reset')
    } catch (error) {
      console.error('Failed to reset provider settings:', error)
      toast.error('Failed to reset provider settings')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-hint mt-1 text-sm">Manage your application data.</p>
      </div>

      <div className="space-y-4">
        <div className="border-error/30 bg-error-subtle/30 rounded-lg border p-4">
          <h3 className="text-error text-sm font-medium">Danger Zone</h3>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-secondary text-sm">
                Delete all job applications and resumes. Provider settings will
                be preserved.
              </p>
              <div className="mt-2">
                <HoldButton
                  onComplete={handleDeleteAllData}
                  disabled={isDeleting}
                  className="text-error hover:bg-error-subtle"
                >
                  {isDeleting ? 'Deleting...' : 'Hold to Delete All Data'}
                </HoldButton>
              </div>
            </div>

            <div>
              <p className="text-secondary text-sm">
                Remove all API keys and authentication. You'll need to
                reconfigure providers to use AI features.
              </p>
              <div className="mt-2">
                <HoldButton
                  onComplete={handleResetProviders}
                  disabled={isResetting}
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
    </div>
  )
}
