import type { AITaskClient } from "../../ai";
import type { WorkspaceApplicationService } from "../../workspace";

export interface WorkflowTaskDeps {
  jobService: WorkspaceApplicationService;
  aiClient: AITaskClient;
}
