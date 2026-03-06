import { getDatabase } from "../../persistence";
import {
  WorkspaceApplicationService,
  WorkspacePersistence,
  checklistIPC,
  jobIPC,
  resumeIPC,
} from "../../workspace";
import { WorkflowService, registerWorkflowHandlers } from "../../workflow";
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
  const workspacePersistence = new WorkspacePersistence(database);
  const workspaceService = new WorkspaceApplicationService(
    workspacePersistence,
  );
  const workflowService = new WorkflowService(
    workspaceService,
    workspacePersistence,
    deps.aiPreferences,
  );

  jobIPC(workspaceService);
  resumeIPC(workspaceService);
  checklistIPC(workspaceService);
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
