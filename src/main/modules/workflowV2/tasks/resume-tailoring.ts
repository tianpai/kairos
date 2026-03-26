import { getAIClient } from "../../ai";
import {
  ChecklistRepository,
  ResumeRepository,
  getDatabase,
} from "../../persistence";
import { BaseTask } from "./task-base";
import type { TaskError } from "./task-base";
import type { ResumeStructure } from "@type/task-contracts";

export class ResumeTailoringTask extends BaseTask {
  readonly name = "resume.tailoring" as const;

  private readonly checklistRepo = new ChecklistRepository(getDatabase());
  private readonly resumeRepo = new ResumeRepository(getDatabase());

  async run(jobId: string): Promise<TaskError | null> {
    const checklistRow = this.checklistRepo.findByJobId(jobId);
    if (!checklistRow?.checklist) {
      return {
        message: "Checklist is missing for tailoring",
        retryable: false,
      };
    }

    const resume = this.resumeRepo.findByJobId(jobId);
    const resumeStructure = resume?.tailoredResume ?? resume?.parsedResume;
    if (!resumeStructure) {
      return {
        message: "Resume content is missing for tailoring",
        retryable: false,
      };
    }

    if (!resume?.templateId) {
      return {
        message: "Template ID is missing for tailoring",
        retryable: false,
      };
    }

    const tailored = await getAIClient().execute<ResumeStructure>(
      "resume.tailoring",
      {
        checklist: checklistRow.checklist,
        resumeStructure,
        templateId: resume.templateId,
      },
      { streaming: true, onPartial: (partial) => this.emit(jobId, partial) },
    );

    this.resumeRepo.updateByJobId(jobId, { tailoredResume: tailored });
    return null;
  }
}
