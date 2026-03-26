import { WorkflowRepository, getDatabase } from "../persistence";
import { WfEngine } from "./engine";
import { workflowRegistry } from "./workflow";
import { ChecklistMatchingTask } from "./tasks/checklist-matching";
import { ChecklistParsingTask } from "./tasks/checklist-parsing";
import { JobInfoExtractingTask } from "./tasks/jobinfo-extracting";
import { ResumeParsingTask } from "./tasks/resume-parsing";
import { ResumeTailoringTask } from "./tasks/resume-tailoring";
import { ScoreUpdatingTask } from "./tasks/score-updating";
import type { BaseTask, TaskName } from "./tasks/task-base";

let engine: WfEngine | null = null;

/**
 * > [!IMPORTANT]
 * > this needs to be called after getDatabase() and initAIClient() are ready
 */
export function initWfEngine(): WfEngine {
  const tasks = new Map<TaskName, BaseTask>();
  tasks.set("resume.parsing", new ResumeParsingTask());
  tasks.set("resume.tailoring", new ResumeTailoringTask());
  tasks.set("checklist.parsing", new ChecklistParsingTask());
  tasks.set("checklist.matching", new ChecklistMatchingTask());
  tasks.set("score.updating", new ScoreUpdatingTask());
  tasks.set("jobinfo.extracting", new JobInfoExtractingTask());
  engine = new WfEngine(
    new WorkflowRepository(getDatabase()),
    tasks,
    workflowRegistry,
  );
  return engine;
}

export function getWfEngine(): WfEngine {
  if (!engine) {
    throw new Error(
      "WorkflowEngine not initialized. Call initWfEngine() first.",
    );
  }
  return engine;
}
