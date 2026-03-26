import { getAIClient } from "../../ai";
import {
  ChecklistRepository,
  JobRepository,
  getDatabase,
} from "../../persistence";
import { BaseTask } from "./task-base";
import type { TaskError } from "./task-base";
import type { ExtractedJobInfo } from "@type/task-contracts";

const EXTRACTING_PLACEHOLDER = "Extracting...";

export class JobInfoExtractingTask extends BaseTask {
  readonly name = "jobinfo.extracting" as const;

  private readonly checklistRepo = new ChecklistRepository(getDatabase());
  private readonly jobRepo = new JobRepository(getDatabase());

  async run(jobId: string): Promise<TaskError | null> {
    const checklistRow = this.checklistRepo.findByJobId(jobId);
    if (!checklistRow?.jobDescription) {
      return {
        message: "No job description to extract info from",
        retryable: false,
      };
    }

    const extracted = await getAIClient().execute<ExtractedJobInfo>(
      "jobinfo.extracting",
      { jobDescription: checklistRow.jobDescription },
      { streaming: true, onPartial: (partial) => this.emit(jobId, partial) },
    );

    const current = this.jobRepo.findByJobId(jobId);
    if (!current) return null;

    // Only overwrite placeholder values
    const updates: Partial<{
      companyName: string;
      position: string;
      updatedAt: string;
    }> = {};

    if (current.companyName === EXTRACTING_PLACEHOLDER && extracted.company) {
      updates.companyName = extracted.company;
    }

    if (current.position === EXTRACTING_PLACEHOLDER && extracted.position) {
      updates.position = extracted.position;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      this.jobRepo.updateByJobId(jobId, updates);
    }

    return null;
  }
}
