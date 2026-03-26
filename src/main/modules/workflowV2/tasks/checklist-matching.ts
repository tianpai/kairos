import { getAIClient } from "../../ai";
import {
  ChecklistRepository,
  ResumeRepository,
  getDatabase,
} from "../../persistence";
import { BaseTask } from "./task-base";
import type { TaskError } from "./task-base";
import type { Checklist } from "@type/checklist";

export class ChecklistMatchingTask extends BaseTask {
  readonly name = "checklist.matching" as const;

  private readonly checklistRepo = new ChecklistRepository(getDatabase());
  private readonly resumeRepo = new ResumeRepository(getDatabase());

  async run(jobId: string): Promise<TaskError | null> {
    const checklistRow = this.checklistRepo.findByJobId(jobId);
    if (!checklistRow?.checklist) {
      return { message: "Checklist is missing for matching", retryable: false };
    }

    const resume = this.resumeRepo.findByJobId(jobId);
    const resumeStructure = resume?.tailoredResume ?? resume?.parsedResume;
    if (!resumeStructure) {
      return {
        message: "Resume content is missing for matching",
        retryable: false,
      };
    }

    const matched = await getAIClient().execute<Checklist>(
      "checklist.matching",
      {
        checklist: checklistRow.checklist,
        resumeStructure,
      },
      { streaming: true, onPartial: (partial) => this.emit(jobId, partial) },
    );

    this.checklistRepo.updateByJobId(jobId, { checklist: matched });
    return null;
  }
}
