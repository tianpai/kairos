import { ipcMain } from "electron";
import {
  findClaudePath,
  getClaudeCliVersion,
  isClaudeCliAuthenticated,
  isClaudeCliInstalled,
  setUserConfiguredPath,
} from "../services/claude-code-cli-validation.service";
import type { SettingsService } from "../config/settings.service";
import type { ClaudeSubscriptionService } from "../services/claude-subscription.service";

interface ClaudeHandlerDeps {
  settingsService: SettingsService;
  claudeSubscriptionService: ClaudeSubscriptionService;
}

export function registerClaudeHandlers({
  settingsService,
  claudeSubscriptionService,
}: ClaudeHandlerDeps): void {
  // Claude OAuth subscription handlers
  ipcMain.handle("claude:startAuth", async () => {
    return claudeSubscriptionService.startAuthorization();
  });

  ipcMain.handle(
    "claude:completeAuth",
    async (_, code: string, codeVerifier?: string) => {
      return claudeSubscriptionService.completeAuthorization(
        code,
        codeVerifier,
      );
    },
  );

  ipcMain.handle("claude:getAccessToken", async () => {
    return claudeSubscriptionService.getAccessToken();
  });

  ipcMain.handle("claude:isAuthenticated", async () => {
    return claudeSubscriptionService.isAuthenticated();
  });

  ipcMain.handle("claude:logout", async () => {
    return claudeSubscriptionService.logout();
  });

  ipcMain.handle("claude:cancelAuth", () => {
    claudeSubscriptionService.cancelAuthorization();
  });

  // Claude auth mode handlers
  ipcMain.handle("claude:getAuthMode", () => {
    return settingsService.getClaudeAuthMode();
  });

  ipcMain.handle("claude:setAuthMode", (_, mode: "oauth" | "cli") => {
    settingsService.setClaudeAuthMode(mode);
  });

  // Claude CLI validation handlers
  ipcMain.handle("claude:cli:isInstalled", () => {
    return isClaudeCliInstalled();
  });

  ipcMain.handle("claude:cli:isAuthenticated", async () => {
    return isClaudeCliAuthenticated();
  });

  ipcMain.handle("claude:cli:getVersion", async () => {
    return getClaudeCliVersion();
  });

  ipcMain.handle("claude:cli:getPath", () => {
    return findClaudePath();
  });

  ipcMain.handle("claude:cli:setPath", (_, path: string | null) => {
    settingsService.setClaudeCliPath(path);
    setUserConfiguredPath(path);
  });

  ipcMain.handle("claude:cli:getConfiguredPath", () => {
    return settingsService.getClaudeCliPath();
  });
}
