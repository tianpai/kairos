import { getDatabase } from "../../persistence";
import { workspaceIPC } from "../../workspace";
import {
  WorkflowPersistence,
  WorkflowService,
  registerWorkflowHandlers,
} from "../../workflow";
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
  const database = getDatabase();

  const workflowPersistence = new WorkflowPersistence(database);
  const workflowService = new WorkflowService(
    workflowPersistence,
    deps.aiPreferences,
  );

  workspaceIPC();
  registerDialogHandlers();
  registerFsHandlers();
  registerAIServerHandlers();
  registerUpdaterHandlers();
  registerApiKeyHandlers({ aiPreferences: deps.aiPreferences });
  registerProviderHandlers({ aiPreferences: deps.aiPreferences });
  registerThemeHandlers({ userPreferences: deps.userPreferences });
  registerShellHandlers();
  registerWorkflowHandlers(workflowService);
  registerBackupHandlers();
}
