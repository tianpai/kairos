/**
 * Resume Tailoring Task
 *
 * Tailors resume content based on checklist requirements.
 */

import { defineTask } from "../definitions/task-registry";
import type { ResumeStructure } from "@type/task-contracts";

export function registerResumeTailoringTask(): void {
  defineTask({
    name: "resume.tailoring",
    streaming: true,

    async execute(jobId, deps, emitPartial) {
      const checklistRow = deps.checklistRepo.findByJobId(jobId);
      if (!checklistRow?.checklist) {
        throw new Error("Checklist is missing for tailoring");
      }

      const resume = deps.resumeRepo.findByJobId(jobId);
      const resumeStructure = resume?.tailoredResume ?? resume?.parsedResume;
      if (!resumeStructure) {
        throw new Error("Resume content is missing for tailoring");
      }

      if (!resume?.templateId) {
        throw new Error("Template ID is missing for tailoring");
      }

      const tailored = await deps.aiClient.execute<ResumeStructure>(
        "resume.tailoring",
        {
          checklist: checklistRow.checklist,
          resumeStructure,
          templateId: resume.templateId,
        },
        emitPartial ? { streaming: true, onPartial: emitPartial } : undefined,
      );

      deps.resumeRepo.updateByJobId(jobId, { tailoredResume: tailored });
    },
  });
}
