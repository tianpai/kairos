import { JobApplicationService } from "../services/job-application.service";
import { getDatabase } from "../services/database.service";
import { registerJobsHandlers } from "./jobs.handlers";
import { registerDialogHandlers } from "./dialog.handlers";
import { registerFsHandlers } from "./fs.handlers";
import { registerAIServerHandlers } from "./ai-server.handlers";
import { registerUpdaterHandlers } from "./updater.handlers";
import { registerSettingsHandlers } from "./settings.handlers";
import { registerOllamaHandlers } from "./ollama.handlers";
import { registerModelHandlers } from "./models.handlers";
import { registerProviderHandlers } from "./provider.handlers";
import { registerThemeHandlers } from "./theme.handlers";
import { registerShellHandlers } from "./shell.handlers";
import type { SettingsService } from "../config/settings.service";

export interface IpcDependencies {
  settingsService: SettingsService;
}

export function registerAllHandlers(deps: IpcDependencies): void {
  const database = getDatabase();
  const jobService = new JobApplicationService(database);
  registerJobsHandlers(jobService);
  registerDialogHandlers();
  registerFsHandlers();
  registerAIServerHandlers();
  registerUpdaterHandlers();
  registerSettingsHandlers(deps);
  registerOllamaHandlers(deps);
  registerModelHandlers(deps);
  registerProviderHandlers(deps);
  registerThemeHandlers(deps);
  registerShellHandlers();
}
