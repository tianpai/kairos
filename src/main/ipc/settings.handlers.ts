import { ipcMain } from "electron";
import log from "electron-log/main";
import type { SettingsService } from "../config/settings.service";

interface SettingsHandlerDeps {
  settingsService: SettingsService;
}

export function registerSettingsHandlers({
  settingsService,
}: SettingsHandlerDeps): void {
  // OpenAI API key handlers
  ipcMain.handle("settings:getApiKey", () => {
    return settingsService.getOpenAIKey();
  });

  ipcMain.handle("settings:setApiKey", (_, key: string) => {
    settingsService.setOpenAIKey(key);
  });

  ipcMain.handle("settings:hasApiKey", () => {
    return settingsService.hasActiveProviderConfigured();
  });

  ipcMain.handle("settings:deleteApiKey", () => {
    settingsService.deleteOpenAIKey();
  });

  // DeepSeek API key handlers
  ipcMain.handle("settings:getDeepSeekApiKey", () => {
    return settingsService.getDeepSeekKey();
  });

  ipcMain.handle("settings:setDeepSeekApiKey", (_, key: string) => {
    settingsService.setDeepSeekKey(key);
  });

  ipcMain.handle("settings:hasDeepSeekApiKey", () => {
    return settingsService.hasDeepSeekKey();
  });

  ipcMain.handle("settings:deleteDeepSeekApiKey", () => {
    settingsService.deleteDeepSeekKey();
  });

  // xAI API key handlers
  ipcMain.handle("settings:getXAIApiKey", () => {
    return settingsService.getXAIKey();
  });

  ipcMain.handle("settings:setXAIApiKey", (_, key: string) => {
    settingsService.setXAIKey(key);
  });

  ipcMain.handle("settings:hasXAIApiKey", () => {
    return settingsService.hasXAIKey();
  });

  ipcMain.handle("settings:deleteXAIApiKey", () => {
    settingsService.deleteXAIKey();
  });

  // Gemini API key handlers
  ipcMain.handle("settings:getGeminiApiKey", () => {
    return settingsService.getGeminiKey();
  });

  ipcMain.handle("settings:setGeminiApiKey", (_, key: string) => {
    settingsService.setGeminiKey(key);
  });

  ipcMain.handle("settings:hasGeminiApiKey", () => {
    return settingsService.hasGeminiKey();
  });

  ipcMain.handle("settings:deleteGeminiApiKey", () => {
    settingsService.deleteGeminiKey();
  });

  // Anthropic API key handlers
  ipcMain.handle("settings:getAnthropicApiKey", () => {
    return settingsService.getAnthropicKey();
  });

  ipcMain.handle("settings:setAnthropicApiKey", (_, key: string) => {
    settingsService.setAnthropicKey(key);
  });

  ipcMain.handle("settings:hasAnthropicApiKey", () => {
    return settingsService.hasAnthropicKey();
  });

  ipcMain.handle("settings:deleteAnthropicApiKey", () => {
    settingsService.deleteAnthropicKey();
  });

  // Reset all providers
  ipcMain.handle("settings:resetAllProviders", async () => {
    settingsService.resetAllProviders();
    log.info("All provider settings reset");
    return { success: true };
  });
}
