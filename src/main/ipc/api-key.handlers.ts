import { ipcMain } from "electron";
import type { ProviderType } from "../../shared/providers";
import type { SettingsService } from "../config/settings.service";

interface ApiKeyHandlerDeps {
  settingsService: SettingsService;
}

export function registerApiKeyHandlers({
  settingsService,
}: ApiKeyHandlerDeps): void {
  ipcMain.handle("apiKey:get", (_, provider: ProviderType) => {
    return settingsService.getApiKey(provider);
  });

  ipcMain.handle("apiKey:set", (_, provider: ProviderType, key: string) => {
    settingsService.setApiKey(provider, key);
  });

  ipcMain.handle("apiKey:has", (_, provider: ProviderType) => {
    return settingsService.hasApiKey(provider);
  });

  ipcMain.handle("apiKey:delete", (_, provider: ProviderType) => {
    settingsService.deleteApiKey(provider);
  });
}
