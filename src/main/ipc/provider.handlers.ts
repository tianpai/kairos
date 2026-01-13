import { ipcMain } from "electron";
import log from "electron-log/main";
import type { ProviderType } from "../../shared/providers";
import type { SettingsService } from "../config/settings.service";

interface ProviderHandlerDeps {
  settingsService: SettingsService;
}

export function registerProviderHandlers({
  settingsService,
}: ProviderHandlerDeps): void {
  // Active provider IPC handlers
  ipcMain.handle("provider:getActive", () => {
    return settingsService.getActiveProvider();
  });

  ipcMain.handle("provider:setActive", (_, provider: ProviderType) => {
    const previous = settingsService.getActiveProvider();
    settingsService.setActiveProvider(provider);
    log.info(`AI provider switched: ${previous} -> ${provider}`);
  });
}
