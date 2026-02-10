/**
 * Score Updating Task
 *
 * Calculates match score from fulfilled checklist requirements.
 * This is a local computation (no AI worker needed).
 */

import log from "electron-log/main";
import { defineTask } from "../define-task";
import type { Checklist, ChecklistRequirement } from "@type/checklist";
import type { WorkflowTaskDeps } from "./task-deps";

// =============================================================================
// Score Calculation Logic
// =============================================================================

const HARD_REQUIREMENT_WEIGHT = 3;
const SOFT_REQUIREMENT_WEIGHT = 1;
const PREFERRED_SKILL_WEIGHT = 1;

function scoreFulfilledRequirements(
  requirements: Array<ChecklistRequirement>,
  baseWeight: number,
): { totalWeight: number; matchedWeight: number } {
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const req of requirements) {
    totalWeight += baseWeight;
    if (req.fulfilled === true) {
      matchedWeight += baseWeight;
    }
  }

  return { totalWeight, matchedWeight };
}

export function calculateScore(checklist: Checklist): number {
  let totalWeight = 0;
  let matchedWeight = 0;

  const hardResults = scoreFulfilledRequirements(
    checklist.hardRequirements,
    HARD_REQUIREMENT_WEIGHT,
  );
  totalWeight += hardResults.totalWeight;
  matchedWeight += hardResults.matchedWeight;

  const softResults = scoreFulfilledRequirements(
    checklist.softRequirements,
    SOFT_REQUIREMENT_WEIGHT,
  );
  totalWeight += softResults.totalWeight;
  matchedWeight += softResults.matchedWeight;

  const preferredResults = scoreFulfilledRequirements(
    checklist.preferredSkills,
    PREFERRED_SKILL_WEIGHT,
  );
  totalWeight += preferredResults.totalWeight;
  matchedWeight += preferredResults.matchedWeight;

  const score =
    totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
  return Math.max(0, Math.min(100, score));
}

// =============================================================================
// Task Definition
// =============================================================================

export function registerScoreUpdatingTask({
  jobService,
}: WorkflowTaskDeps): void {
  defineTask({
    name: "score.updating",
    inputKeys: ["checklist"],
    // No 'provides' - score is saved directly to DB, not added to context

    async execute({ checklist }, _meta) {
      if (!checklist?.hardRequirements) {
        log.warn("Score update: no checklist found");
        return 0;
      }

      const score = calculateScore(checklist);
      log.info(`Score calculated: ${score}%`);
      return score;
    },

    async onSuccess(jobId, matchPercentage) {
      await jobService.saveMatchScore(jobId, matchPercentage);
      log.info(`Score saved: ${matchPercentage}% for job ${jobId}`);
    },
  });
}
