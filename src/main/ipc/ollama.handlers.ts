import { ipcMain } from "electron";
import log from "electron-log/main";
import {
  cancelPullModel,
  getInstalledCuratedModels,
  getOllamaCuratedModels,
  getOllamaVersion,
  isOllamaRunning,
  pullOllamaModel,
  setOllamaBaseUrl,
} from "../services/ollama.service";
import type { SettingsService } from "../config/settings.service";

interface OllamaHandlerDeps {
  settingsService: SettingsService;
}

export function registerOllamaHandlers({
  settingsService,
}: OllamaHandlerDeps): void {
  ipcMain.handle("ollama:isRunning", async () => {
    return isOllamaRunning();
  });

  ipcMain.handle("ollama:getVersion", async () => {
    return getOllamaVersion();
  });

  ipcMain.handle("ollama:getInstalledModels", async () => {
    return getInstalledCuratedModels();
  });

  ipcMain.handle("ollama:getCuratedModels", () => {
    return getOllamaCuratedModels();
  });

  ipcMain.handle("ollama:pullModel", async (event, modelName: string) => {
    try {
      await pullOllamaModel(modelName, (progress) => {
        event.sender.send("ollama:pullProgress", { modelName, progress });
      });
      return { success: true };
    } catch (error) {
      log.error(`Failed to pull Ollama model ${modelName}:`, error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle("ollama:cancelPull", () => {
    cancelPullModel();
  });

  ipcMain.handle("ollama:getBaseUrl", () => {
    return settingsService.getOllamaBaseUrl();
  });

  ipcMain.handle("ollama:setBaseUrl", (_, url: string) => {
    settingsService.setOllamaBaseUrl(url);
    setOllamaBaseUrl(url);
  });
}
