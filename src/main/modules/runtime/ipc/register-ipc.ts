import { workspaceIPC } from "../../workspace";
import { registerWfHandlers } from "../../workflowV2/workflow.ipc";
import {
  registerBackupHandlers,
  registerDialogHandlers,
  registerFsHandlers,
  registerShellHandlers,
  registerUpdaterHandlers,
} from "../../system";
import { registerApiKeyHandlers, registerProviderHandlers } from "../../ai";
import { registerThemeHandlers } from "../../user";
import { registerAIServerHandlers } from "./ai-server.ipc";
import type { AiPreferencesStore } from "../../ai";
import type { UserPreferencesStore } from "../../user";

export interface RuntimeIpcDependencies {
  aiPreferences: AiPreferencesStore;
  userPreferences: UserPreferencesStore;
}

export function registerIpcHandlers(deps: RuntimeIpcDependencies): void {
  workspaceIPC();
  registerWfHandlers();
  registerDialogHandlers();
  registerFsHandlers();
  registerAIServerHandlers();
  registerUpdaterHandlers();
  registerApiKeyHandlers({ aiPreferences: deps.aiPreferences });
  registerProviderHandlers({ aiPreferences: deps.aiPreferences });
  registerThemeHandlers({ userPreferences: deps.userPreferences });
  registerShellHandlers();
  registerBackupHandlers();
}
