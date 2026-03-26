import { ipcMain, nativeTheme } from "electron";
import type { ThemeSource, ThemeState } from "@type/theme";
import type { UserPreferencesStore } from "../preferences/user-preferences.store";

interface ThemeHandlerDeps {
  userPreferences: UserPreferencesStore;
}

export function registerThemeHandlers({
  userPreferences,
}: ThemeHandlerDeps): void {
  ipcMain.handle("theme:get", (): ThemeState => {
    const source = userPreferences.getThemeSource();
    const current = nativeTheme.shouldUseDarkColors ? "dark" : "light";
    return { source, current };
  });

  ipcMain.handle("theme:set", (_, theme: ThemeSource) => {
    userPreferences.setThemeSource(theme);
    nativeTheme.themeSource = theme;
  });
}
