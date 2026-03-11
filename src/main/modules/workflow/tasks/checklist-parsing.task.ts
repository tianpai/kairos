/**
 * Checklist Parsing Task
 *
 * Extracts job requirements from job description.
 */

import { defineTask } from "../definitions/task-registry";
import type { Checklist } from "@type/checklist";

export function registerChecklistParsingTask(): void {
  defineTask({
    name: "checklist.parsing",
    streaming: true,

    async execute(jobId, deps, emitPartial) {
      const checklistRow = deps.checklistRepo.findByJobId(jobId);
      if (!checklistRow?.jobDescription) {
        throw new Error("No job description to parse");
      }

      const checklist = await deps.aiClient.execute<Checklist>(
        "checklist.parsing",
        { jobDescription: checklistRow.jobDescription },
        emitPartial ? { streaming: true, onPartial: emitPartial } : undefined,
      );

      deps.checklistRepo.updateByJobId(jobId, { checklist });
    },
  });
}
