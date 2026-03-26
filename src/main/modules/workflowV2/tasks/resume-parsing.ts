import { getAIClient } from "../../ai";
import { ResumeRepository, getDatabase } from "../../persistence";
import { BaseTask } from "./task-base";
import type { TaskError } from "./task-base";
import type { ResumeStructure } from "@type/task-contracts";

export class ResumeParsingTask extends BaseTask {
  readonly name = "resume.parsing" as const;

  private readonly resumeRepo = new ResumeRepository(getDatabase());

  async run(jobId: string): Promise<TaskError | null> {
    const resume = this.resumeRepo.findByJobId(jobId);
    if (!resume?.originalResume) {
      return { message: "No resume to parse", retryable: false };
    }

    const parsed = await getAIClient().execute<ResumeStructure>(
      "resume.parsing",
      {
        rawResumeContent: resume.originalResume,
        templateId: resume.templateId,
      },
      { streaming: true, onPartial: (partial) => this.emit(jobId, partial) },
    );

    this.resumeRepo.updateByJobId(jobId, {
      parsedResume: parsed,
      tailoredResume: parsed,
    });
    return null;
  }
}
