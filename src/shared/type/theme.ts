export type ThemeSource = "system" | "light" | "dark";

export type ThemeMode = "light" | "dark";

export interface ThemeState {
  source: ThemeSource;
  current: ThemeMode;
}
