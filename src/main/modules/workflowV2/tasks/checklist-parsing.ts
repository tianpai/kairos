import { getAIClient } from "../../ai";
import { ChecklistRepository, getDatabase } from "../../persistence";
import { BaseTask } from "./task-base";
import type { TaskError } from "./task-base";
import type { Checklist } from "@type/checklist";

export class ChecklistParsingTask extends BaseTask {
  readonly name = "checklist.parsing" as const;

  private readonly checklistRepo = new ChecklistRepository(getDatabase());

  async run(jobId: string): Promise<TaskError | null> {
    const checklistRow = this.checklistRepo.findByJobId(jobId);
    if (!checklistRow?.jobDescription) {
      return { message: "No job description to parse", retryable: false };
    }

    const checklist = await getAIClient().execute<Checklist>(
      "checklist.parsing",
      { jobDescription: checklistRow.jobDescription },
      { streaming: true, onPartial: (partial) => this.emit(jobId, partial) },
    );

    this.checklistRepo.updateByJobId(jobId, { checklist });
    return null;
  }
}
