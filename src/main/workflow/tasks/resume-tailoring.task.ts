/**
 * Resume Tailoring Task
 *
 * Tailors resume content based on checklist requirements.
 */

import { defineTask } from "../define-task";
import type { ResumeStructure } from "@type/task-contracts";
import type { WorkflowTaskDeps } from "./task-deps";

export function registerResumeTailoringTask({
  jobService,
  aiClient,
}: WorkflowTaskDeps): void {
  defineTask({
    name: "resume.tailoring",
    inputKeys: ["checklist", "resumeStructure", "templateId"],
    provides: "resumeStructure",
    streaming: true,

    async execute({ checklist, resumeStructure, templateId }, meta) {
      return aiClient.execute<ResumeStructure>(
        "resume.tailoring",
        {
          checklist,
          resumeStructure,
          templateId,
        },
        meta.emitPartial
          ? { streaming: true, onPartial: meta.emitPartial }
          : undefined,
      );
    },

    async onSuccess(jobId, tailoredResume) {
      await jobService.saveTailoredResume(jobId, { tailoredResume });
    },
  });
}
