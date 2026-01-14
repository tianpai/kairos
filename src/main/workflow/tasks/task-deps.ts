import type { JobApplicationService } from "../../services/job-application.service";
import type { AITaskClient } from "../../ai/ai-task-client";

export interface WorkflowTaskDeps {
  jobService: JobApplicationService;
  aiClient: AITaskClient;
}
