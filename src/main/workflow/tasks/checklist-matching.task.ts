/**
 * Checklist Matching Task
 *
 * Matches resume content against job requirements.
 * Uses AI worker to determine which requirements are fulfilled.
 */

import { defineTask } from "../define-task";
import type { Checklist } from "@type/checklist";
import type { WorkflowTaskDeps } from "./task-deps";

export function registerChecklistMatchingTask({
  jobService,
  aiClient,
}: WorkflowTaskDeps): void {
  defineTask({
    name: "checklist.matching",
    inputKeys: ["checklist", "resumeStructure"],
    provides: "checklist", // Overwrites checklist with fulfilled status
    streaming: true,

    async execute({ checklist, resumeStructure }, meta) {
      return aiClient.execute<Checklist>(
        "checklist.matching",
        {
          checklist,
          resumeStructure,
        },
        meta.emitPartial
          ? { streaming: true, onPartial: meta.emitPartial }
          : undefined,
      );
    },

    async onSuccess(jobId, checklist) {
      await jobService.saveChecklist(jobId, { checklist });
    },
  });
}
