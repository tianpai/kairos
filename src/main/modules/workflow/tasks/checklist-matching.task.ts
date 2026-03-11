/**
 * Checklist Matching Task
 *
 * Matches resume content against job requirements.
 * Uses AI to determine which requirements are fulfilled.
 */

import { defineTask } from "../definitions/task-registry";
import type { Checklist } from "@type/checklist";

export function registerChecklistMatchingTask(): void {
  defineTask({
    name: "checklist.matching",
    streaming: true,

    async execute(jobId, deps, emitPartial) {
      const checklistRow = deps.checklistRepo.findByJobId(jobId);
      if (!checklistRow?.checklist) {
        throw new Error("Checklist is missing for matching");
      }

      const resume = deps.resumeRepo.findByJobId(jobId);
      const resumeStructure = resume?.tailoredResume ?? resume?.parsedResume;
      if (!resumeStructure) {
        throw new Error("Resume content is missing for matching");
      }

      const matched = await deps.aiClient.execute<Checklist>(
        "checklist.matching",
        {
          checklist: checklistRow.checklist,
          resumeStructure,
        },
        emitPartial ? { streaming: true, onPartial: emitPartial } : undefined,
      );

      deps.checklistRepo.updateByJobId(jobId, { checklist: matched });
    },
  });
}
