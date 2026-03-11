/**
 * Job Info Extracting Task
 *
 * Extracts company, position, and due date from job description.
 * Updates DB directly — only overwrites placeholder values.
 */

import { defineTask } from "../definitions/task-registry";
import type { ExtractedJobInfo } from "@type/task-contracts";

const EXTRACTING_PLACEHOLDER = "Extracting...";

export function registerJobInfoExtractingTask(): void {
  defineTask({
    name: "jobinfo.extracting",
    streaming: true,

    async execute(jobId, deps, emitPartial) {
      const checklistRow = deps.checklistRepo.findByJobId(jobId);
      if (!checklistRow?.jobDescription) {
        throw new Error("No job description to extract info from");
      }

      const extracted = await deps.aiClient.execute<ExtractedJobInfo>(
        "jobinfo.extracting",
        { jobDescription: checklistRow.jobDescription },
        emitPartial ? { streaming: true, onPartial: emitPartial } : undefined,
      );

      // Fetch current job to check which fields are placeholders
      const current = deps.jobRepo.findByJobId(jobId);
      if (!current) return;

      // TODO: (workflow) Persist extracted dueDate with a clear overwrite
      // policy (placeholder-only or always) and date validation.
      const updates: Partial<{
        companyName: string;
        position: string;
        updatedAt: string;
      }> = {};

      if (current.companyName === EXTRACTING_PLACEHOLDER && extracted.company) {
        updates.companyName = extracted.company;
      }

      if (current.position === EXTRACTING_PLACEHOLDER && extracted.position) {
        updates.position = extracted.position;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        deps.jobRepo.updateByJobId(jobId, updates);
      }
    },
  });
}
