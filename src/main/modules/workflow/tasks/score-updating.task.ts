/**
 * Score Updating Task
 *
 * Calculates match score from fulfilled checklist requirements.
 * This is a local computation (no AI call needed).
 */

import log from "electron-log/main";
import { defineTask } from "../definitions/task-registry";
import type { Checklist, ChecklistRequirement } from "@type/checklist";

// =============================================================================
// Score Calculation Logic
// =============================================================================

const HARD_REQUIREMENT_WEIGHT = 3;
const SOFT_REQUIREMENT_WEIGHT = 1;
const PREFERRED_SKILL_WEIGHT = 1;

function scoreFulfilledRequirements(
  requirements: ChecklistRequirement[],
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

export function registerScoreUpdatingTask(): void {
  defineTask({
    name: "score.updating",

    async execute(jobId, deps) {
      const checklistRow = deps.checklistRepo.findByJobId(jobId);
      if (!checklistRow?.checklist?.hardRequirements) {
        log.warn("Score update: no checklist found");
        deps.scoreRepo.updateByJobId(jobId, { matchPercentage: 0 });
        return;
      }

      const score = calculateScore(checklistRow.checklist);
      log.info(`Score calculated: ${score}%`);

      deps.scoreRepo.updateByJobId(jobId, { matchPercentage: score });
      log.info(`Score saved: ${score}% for job ${jobId}`);
    },
  });
}
