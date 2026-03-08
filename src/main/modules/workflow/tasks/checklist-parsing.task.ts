/**
 * Checklist Parsing Task
 *
 * Extracts job requirements from job description.
 */

import { defineTask } from "../definitions/task-registry";
import type { Checklist } from "@type/checklist";
import type { WorkflowTaskDeps } from "./task-deps";

export function registerChecklistParsingTask({
  persistence,
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
      await persistence.saveChecklist(jobId, { checklist });
    },
  });
}
