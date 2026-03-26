import type { ThemeSource, ThemeState } from '@type/theme'

export type { ThemeMode, ThemeSource, ThemeState } from '@type/theme'

export function getTheme(): Promise<ThemeState> {
  return window.kairos.theme.get()
}

export function setTheme(theme: ThemeSource): Promise<void> {
  return window.kairos.theme.set(theme)
}
