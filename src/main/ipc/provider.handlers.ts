import { ipcMain } from "electron";
import log from "electron-log/main";
import {
  fetchAnthropicModels,
  fetchDeepSeekModels,
  fetchGeminiModels,
  fetchOpenAIModels,
  fetchXAIModels,
  getDefaultModel,
  getFallbackModels,
} from "../services/ai-models.service";
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

  ipcMain.handle("provider:resetAll", async () => {
    settingsService.resetAllProviders();
    log.info("All provider settings reset");
    return { success: true };
  });

  ipcMain.handle("provider:fetchModels", async (_, provider: ProviderType) => {
    try {
      const apiKey = settingsService.getApiKey(provider);
      if (!apiKey) {
        return getFallbackModels(provider);
      }

      let models;
      switch (provider) {
        case "openai":
          models = await fetchOpenAIModels(apiKey);
          break;
        case "deepseek":
          models = await fetchDeepSeekModels(apiKey);
          break;
        case "xai":
          models = await fetchXAIModels(apiKey);
          break;
        case "gemini":
          models = await fetchGeminiModels(apiKey);
          break;
        case "anthropic":
          models = await fetchAnthropicModels(apiKey);
          break;
        default:
          return getFallbackModels(provider);
      }

      settingsService.setCachedModels(
        provider,
        models.map((model) => model.id),
      );
      return models;
    } catch (error) {
      log.error("Failed to fetch models:", error);
      return getFallbackModels(provider);
    }
  });

  ipcMain.handle("provider:getCachedModels", (_, provider: ProviderType) => {
    return settingsService.getCachedModels(provider);
  });

  ipcMain.handle("provider:getSelectedModel", (_, provider: ProviderType) => {
    return settingsService.getSelectedModel(provider);
  });

  ipcMain.handle(
    "provider:setSelectedModel",
    (_, provider: ProviderType, model: string) => {
      const previous = settingsService.getSelectedModel(provider);
      settingsService.setSelectedModel(provider, model);
      log.info(
        `${provider} model changed: ${previous ?? "default"} -> ${model}`,
      );
    },
  );

  ipcMain.handle("provider:getDefaultModel", (_, provider: ProviderType) => {
    return getDefaultModel(provider);
  });
}
