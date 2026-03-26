import { ipcMain } from "electron";
import log from "electron-log/main";
import { fetchModels } from "../models/model-catalog.service";
import type { ProviderType } from "../../../../shared/providers";
import type { AiPreferencesStore } from "../config/ai-preferences.store";

interface ProviderHandlerDeps {
  aiPreferences: AiPreferencesStore;
}

export function registerProviderHandlers({
  aiPreferences,
}: ProviderHandlerDeps): void {
  // Active provider IPC handlers
  ipcMain.handle("provider:getActive", () => {
    return aiPreferences.getActiveProvider();
  });

  ipcMain.handle("provider:setActive", (_, provider: ProviderType) => {
    const previous = aiPreferences.getActiveProvider();
    aiPreferences.setActiveProvider(provider);
    log.info(`AI provider switched: ${previous} -> ${provider}`);
  });

  ipcMain.handle("provider:resetAll", async () => {
    aiPreferences.resetAllProviders();
    log.info("All provider settings reset");
    return { success: true };
  });

  ipcMain.handle("provider:fetchModels", async (_, provider: ProviderType) => {
    const apiKey = aiPreferences.getApiKey(provider);
    if (!apiKey) {
      return [];
    }

    const models = await fetchModels(provider, apiKey);
    aiPreferences.setCachedModels(
      provider,
      models.map((model) => model.id),
    );
    return models;
  });

  ipcMain.handle("provider:getCachedModels", (_, provider: ProviderType) => {
    return aiPreferences.getCachedModels(provider);
  });

  ipcMain.handle("provider:getSelectedModel", (_, provider: ProviderType) => {
    return aiPreferences.getSelectedModel(provider);
  });

  ipcMain.handle(
    "provider:setSelectedModel",
    (_, provider: ProviderType, model: string) => {
      const previous = aiPreferences.getSelectedModel(provider);
      aiPreferences.setSelectedModel(provider, model);
      log.info(
        `${provider} model changed: ${previous ?? "none"} -> ${model}`,
      );
    },
  );
}
