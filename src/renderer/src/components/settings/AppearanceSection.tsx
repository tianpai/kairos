import { Monitor, Moon, Sun } from 'lucide-react'
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

export function AppearanceSection() {
  const { data: currentTheme } = useTheme()
  const setTheme = useSetTheme()

  const handleThemeChange = (theme: ThemeSource) => {
    setTheme.mutate(theme)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-hint">
          Customize the look and feel of the app.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-3 block text-sm font-medium text-secondary">
            Theme
          </label>
          <div className="flex gap-2">
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
          <p className="mt-2 text-xs text-hint">
            In dark mode, the resume preview adapts for readability. Downloaded
            PDFs remain unchanged.
          </p>
        </div>
      </div>
    </div>
  )
}
