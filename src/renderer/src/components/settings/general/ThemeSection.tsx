import { Monitor, Moon, Sun } from 'lucide-react'

export type ThemeSource = 'system' | 'light' | 'dark'

const THEME_OPTIONS: Array<{
  value: ThemeSource
  label: string
  icon: typeof Monitor
}> = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

interface ThemeSectionProps {
  currentTheme: ThemeSource | undefined
  onThemeChange: (theme: ThemeSource) => void
}

export function ThemeSection({
  currentTheme,
  onThemeChange,
}: ThemeSectionProps) {
  return (
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
                onClick={() => onThemeChange(option.value)}
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
          In dark mode, the resume preview adapts for readability. Downloaded
          PDFs remain unchanged.
        </p>
      </div>
    </div>
  )
}
