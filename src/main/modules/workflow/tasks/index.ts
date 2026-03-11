import { registerChecklistMatchingTask } from "./checklist-matching.task";
import { registerChecklistParsingTask } from "./checklist-parsing.task";
import { registerJobInfoExtractingTask } from "./jobinfo-extracting.task";
import { registerResumeParsingTask } from "./resume-parsing.task";
import { registerResumeTailoringTask } from "./resume-tailoring.task";
import { registerScoreUpdatingTask } from "./score-updating.task";

export function registerWorkflowTasks(): void {
  registerScoreUpdatingTask();
  registerChecklistMatchingTask();
  registerResumeParsingTask();
  registerResumeTailoringTask();
  registerChecklistParsingTask();
  registerJobInfoExtractingTask();
}
