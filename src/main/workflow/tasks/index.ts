import { registerChecklistMatchingTask } from "./checklist-matching.task";
import { registerChecklistParsingTask } from "./checklist-parsing.task";
import { registerJobInfoExtractingTask } from "./jobinfo-extracting.task";
import { registerResumeParsingTask } from "./resume-parsing.task";
import { registerResumeTailoringTask } from "./resume-tailoring.task";
import { registerScoreUpdatingTask } from "./score-updating.task";
import type { WorkflowTaskDeps } from "./task-deps";

export function registerWorkflowTasks(deps: WorkflowTaskDeps): void {
  registerScoreUpdatingTask(deps);
  registerChecklistMatchingTask(deps);
  registerResumeParsingTask(deps);
  registerResumeTailoringTask(deps);
  registerChecklistParsingTask(deps);
  registerJobInfoExtractingTask(deps);
}
