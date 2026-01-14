/**
 * Resume Parsing Task
 *
 * Parses raw resume content into structured format.
 */

import { defineTask } from "../define-task";
import type { ResumeStructure } from "@type/task-contracts";
import type { WorkflowTaskDeps } from "./task-deps";

export function registerResumeParsingTask({
  jobService,
  aiClient,
}: WorkflowTaskDeps): void {
  defineTask({
    name: "resume.parsing",
    inputKeys: ["rawResumeContent", "templateId"],
    provides: "resumeStructure",
    streaming: true,

    async execute({ rawResumeContent, templateId }, meta) {
      return aiClient.execute<ResumeStructure>(
        "resume.parsing",
        {
          rawResumeContent,
          templateId,
        },
        meta.emitPartial
          ? { streaming: true, onPartial: meta.emitPartial }
          : undefined,
      );
    },

    async onSuccess(jobId, resumeStructure) {
      await jobService.saveParsedResume(jobId, {
        parsedResume: resumeStructure,
        tailoredResume: resumeStructure,
      });
    },
  });
}
