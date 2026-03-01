export type ThemeSource = 'system' | 'light' | 'dark'
export type ThemeMode = 'light' | 'dark'

export function getTheme(): Promise<ThemeSource> {
  return window.kairos.theme.get()
}

export function setTheme(theme: ThemeSource): Promise<void> {
  return window.kairos.theme.set(theme)
}

export function getCurrentTheme(): Promise<ThemeMode> {
  return window.kairos.theme.getCurrent()
}
