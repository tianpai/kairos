import type { AITaskClient } from "../../ai";
import type {
  ChecklistRepository,
  JobRepository,
  ResumeRepository,
  ScoreRepository,
} from "../../persistence";

export interface TaskDeps {
  aiClient: AITaskClient;
  jobRepo: JobRepository;
  resumeRepo: ResumeRepository;
  checklistRepo: ChecklistRepository;
  scoreRepo: ScoreRepository;
}
