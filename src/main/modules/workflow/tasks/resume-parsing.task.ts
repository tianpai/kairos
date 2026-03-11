/**
 * Resume Parsing Task
 *
 * Parses raw resume content into structured format.
 */

import { defineTask } from "../definitions/task-registry";
import type { ResumeStructure } from "@type/task-contracts";

export function registerResumeParsingTask(): void {
  defineTask({
    name: "resume.parsing",
    streaming: true,

    async execute(jobId, deps, emitPartial) {
      const resume = deps.resumeRepo.findByJobId(jobId);
      if (!resume?.originalResume) {
        throw new Error("No resume to parse");
      }

      const parsed = await deps.aiClient.execute<ResumeStructure>(
        "resume.parsing",
        {
          rawResumeContent: resume.originalResume,
          templateId: resume.templateId,
        },
        emitPartial ? { streaming: true, onPartial: emitPartial } : undefined,
      );

      deps.resumeRepo.updateByJobId(jobId, {
        parsedResume: parsed,
        tailoredResume: parsed,
      });
    },
  });
}
