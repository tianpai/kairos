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
import { getInstalledCuratedModels } from "../services/ollama.service";
import type { ProviderType } from "../../shared/providers";
import type { SettingsService } from "../config/settings.service";

interface ModelHandlerDeps {
  settingsService: SettingsService;
}

export function registerModelHandlers({
  settingsService,
}: ModelHandlerDeps): void {
  ipcMain.handle("models:fetch", async (_, provider: ProviderType) => {
    try {
      let models;
      if (provider === "openai") {
        const apiKey = settingsService.getOpenAIKey();
        if (!apiKey) {
          return getFallbackModels(provider);
        }
        models = await fetchOpenAIModels(apiKey);
        settingsService.setOpenAICachedModels(models.map((m) => m.id));
      } else if (provider === "deepseek") {
        const apiKey = settingsService.getDeepSeekKey();
        if (!apiKey) {
          return getFallbackModels(provider);
        }
        models = await fetchDeepSeekModels(apiKey);
        settingsService.setDeepSeekCachedModels(models.map((m) => m.id));
      } else if (provider === "xai") {
        const apiKey = settingsService.getXAIKey();
        if (!apiKey) {
          return getFallbackModels(provider);
        }
        models = await fetchXAIModels(apiKey);
        settingsService.setXAICachedModels(models.map((m) => m.id));
      } else if (provider === "gemini") {
        const apiKey = settingsService.getGeminiKey();
        if (!apiKey) {
          return getFallbackModels(provider);
        }
        models = await fetchGeminiModels(apiKey);
        settingsService.setGeminiCachedModels(models.map((m) => m.id));
      } else if (provider === "ollama") {
        // Ollama returns intersection of installed and curated models
        models = await getInstalledCuratedModels();
        settingsService.setOllamaCachedModels(models.map((m) => m.id));
      } else if (provider === "anthropic") {
        const apiKey = settingsService.getAnthropicKey();
        if (!apiKey) {
          return getFallbackModels(provider);
        }
        models = await fetchAnthropicModels(apiKey);
        settingsService.setAnthropicCachedModels(models.map((m) => m.id));
      } else {
        return getFallbackModels(provider);
      }
      return models;
    } catch (error) {
      log.error("Failed to fetch models:", error);
      return getFallbackModels(provider);
    }
  });

  ipcMain.handle("models:getCachedIds", (_, provider: ProviderType) => {
    if (provider === "openai") {
      return settingsService.getOpenAICachedModels();
    } else if (provider === "deepseek") {
      return settingsService.getDeepSeekCachedModels();
    } else if (provider === "xai") {
      return settingsService.getXAICachedModels();
    } else if (provider === "gemini") {
      return settingsService.getGeminiCachedModels();
    } else if (provider === "ollama") {
      return settingsService.getOllamaCachedModels();
    } else if (provider === "anthropic") {
      return settingsService.getAnthropicCachedModels();
    }
    return [];
  });

  ipcMain.handle("models:getSelected", (_, provider: ProviderType) => {
    if (provider === "openai") {
      return settingsService.getOpenAISelectedModel();
    } else if (provider === "deepseek") {
      return settingsService.getDeepSeekSelectedModel();
    } else if (provider === "xai") {
      return settingsService.getXAISelectedModel();
    } else if (provider === "gemini") {
      return settingsService.getGeminiSelectedModel();
    } else if (provider === "ollama") {
      return settingsService.getOllamaSelectedModel();
    } else if (provider === "anthropic") {
      return settingsService.getAnthropicSelectedModel();
    }
    return null;
  });

  ipcMain.handle(
    "models:setSelected",
    (_, provider: ProviderType, model: string) => {
      if (provider === "openai") {
        const previous = settingsService.getOpenAISelectedModel();
        settingsService.setOpenAISelectedModel(model);
        log.info(`OpenAI model changed: ${previous ?? "default"} -> ${model}`);
      } else if (provider === "deepseek") {
        const previous = settingsService.getDeepSeekSelectedModel();
        settingsService.setDeepSeekSelectedModel(model);
        log.info(
          `DeepSeek model changed: ${previous ?? "default"} -> ${model}`,
        );
      } else if (provider === "xai") {
        const previous = settingsService.getXAISelectedModel();
        settingsService.setXAISelectedModel(model);
        log.info(`xAI model changed: ${previous ?? "default"} -> ${model}`);
      } else if (provider === "gemini") {
        const previous = settingsService.getGeminiSelectedModel();
        settingsService.setGeminiSelectedModel(model);
        log.info(`Gemini model changed: ${previous ?? "default"} -> ${model}`);
      } else if (provider === "ollama") {
        const previous = settingsService.getOllamaSelectedModel();
        settingsService.setOllamaSelectedModel(model);
        log.info(`Ollama model changed: ${previous ?? "default"} -> ${model}`);
      } else if (provider === "anthropic") {
        const previous = settingsService.getAnthropicSelectedModel();
        settingsService.setAnthropicSelectedModel(model);
        log.info(
          `Anthropic model changed: ${previous ?? "default"} -> ${model}`,
        );
      }
    },
  );

  ipcMain.handle("models:getDefault", async (_, provider: ProviderType) => {
    // For Ollama, return first installed model instead of hardcoded default
    if (provider === "ollama") {
      const installed = await getInstalledCuratedModels();
      if (installed.length > 0) {
        return installed[0].id;
      }
    }
    return getDefaultModel(provider);
  });
}
