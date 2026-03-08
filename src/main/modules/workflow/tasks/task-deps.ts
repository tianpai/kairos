import type { AITaskClient } from "../../ai";
import type { WorkflowPersistencePort } from "../persistence/workflow.persistence";

export interface WorkflowTaskDeps {
  persistence: WorkflowPersistencePort;
  aiClient: AITaskClient;
}
