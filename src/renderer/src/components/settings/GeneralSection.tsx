import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Monitor, Moon, Sun } from 'lucide-react'
import { HoldButton } from '@ui/HoldButton'
import { useSetTheme, useTheme } from '@hooks/useTheme'

type ThemeSource = 'system' | 'light' | 'dark'

const THEME_OPTIONS: Array<{
  value: ThemeSource
  label: string
  icon: typeof Monitor
}> = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

export function GeneralSection() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentTheme } = useTheme()
  const setTheme = useSetTheme()
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
      navigate({ to: '/' })
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

  const handleThemeChange = (theme: ThemeSource) => {
    setTheme.mutate(theme)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-hint mt-1 text-sm">
          Manage app preferences and data.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-secondary text-sm font-medium">Appearance</h3>
          <div>
            <label className="text-secondary mb-3 block text-sm font-medium">
              Theme
            </label>
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = currentTheme === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`flex items-center gap-2 rounded-md border-2 px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary text-base'
                        : 'border-default bg-base text-secondary hover:border-hint'
                    }`}
                  >
                    <Icon size={16} />
                    {option.label}
                  </button>
                )
              })}
            </div>
            <p className="text-hint mt-2 text-xs">
              In dark mode, the resume preview adapts for readability.
              Downloaded PDFs remain unchanged.
            </p>
          </div>
        </div>

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
