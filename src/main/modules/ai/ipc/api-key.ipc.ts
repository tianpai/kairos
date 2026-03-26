import { ipcMain } from "electron";
import type { ProviderType } from "../../../../shared/providers";
import type { AiPreferencesStore } from "../config/ai-preferences.store";

interface ApiKeyHandlerDeps {
  aiPreferences: AiPreferencesStore;
}

export function registerApiKeyHandlers({
  aiPreferences,
}: ApiKeyHandlerDeps): void {
  ipcMain.handle("apiKey:get", (_, provider: ProviderType) => {
    return aiPreferences.getApiKey(provider);
  });

  ipcMain.handle("apiKey:set", (_, provider: ProviderType, key: string) => {
    aiPreferences.setApiKey(provider, key);
  });

  ipcMain.handle("apiKey:has", (_, provider: ProviderType) => {
    return aiPreferences.hasApiKey(provider);
  });

  ipcMain.handle("apiKey:delete", (_, provider: ProviderType) => {
    aiPreferences.deleteApiKey(provider);
  });
}
