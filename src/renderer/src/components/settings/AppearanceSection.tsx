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
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize the look and feel of the app.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Icon size={16} />
                  {option.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            In dark mode, the resume preview adapts for readability. Downloaded
            PDFs remain unchanged.
          </p>
        </div>
      </div>
    </div>
  )
}
