import { ipcMain, nativeTheme } from "electron";
import type { SettingsService } from "../config/settings.service";
import type { ThemeSource, ThemeState } from "@type/theme";

interface ThemeHandlerDeps {
  settingsService: SettingsService;
}

export function registerThemeHandlers({
  settingsService,
}: ThemeHandlerDeps): void {
  ipcMain.handle("theme:get", (): ThemeState => {
    const source = settingsService.getTheme();
    const current = nativeTheme.shouldUseDarkColors ? "dark" : "light";
    return { source, current };
  });

  ipcMain.handle("theme:set", (_, theme: ThemeSource) => {
    settingsService.setTheme(theme);
    nativeTheme.themeSource = theme;
  });
}
