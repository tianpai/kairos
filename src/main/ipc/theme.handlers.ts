import { ipcMain, nativeTheme } from "electron";
import type { SettingsService } from "../config/settings.service";

interface ThemeHandlerDeps {
  settingsService: SettingsService;
}

export function registerThemeHandlers({
  settingsService,
}: ThemeHandlerDeps): void {
  ipcMain.handle("theme:get", () => {
    return settingsService.getTheme();
  });

  ipcMain.handle("theme:set", (_, theme: "system" | "light" | "dark") => {
    settingsService.setTheme(theme);
    nativeTheme.themeSource = theme;
  });

  ipcMain.handle("theme:getCurrent", () => {
    return nativeTheme.shouldUseDarkColors ? "dark" : "light";
  });
}
