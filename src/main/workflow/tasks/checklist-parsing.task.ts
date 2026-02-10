/**
 * Checklist Parsing Task
 *
 * Extracts job requirements from job description.
 */

import { defineTask } from "../define-task";
import type { Checklist } from "@type/checklist";
import type { WorkflowTaskDeps } from "./task-deps";

export function registerChecklistParsingTask({
  jobService,
  aiClient,
}: WorkflowTaskDeps): void {
  defineTask({
    name: "checklist.parsing",
    inputKeys: ["jobDescription"],
    provides: "checklist",
    streaming: true,

    async execute({ jobDescription }, meta) {
      return aiClient.execute<Checklist>(
        "checklist.parsing",
        {
          jobDescription,
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
