/**
 * Resume Tailoring Task
 *
 * Tailors resume content based on checklist requirements.
 */

import { defineTask } from "../definitions/task-registry";
import type { ResumeStructure } from "@type/task-contracts";
import type { WorkflowTaskDeps } from "./task-deps";

export function registerResumeTailoringTask({
  persistence,
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
      persistence.saveTailoredResume(jobId, { tailoredResume });
    },
  });
}
