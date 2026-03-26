import log from "electron-log/main";
import {
  ChecklistRepository,
  ScoreRepository,
  getDatabase,
} from "../../persistence";
import { BaseTask } from "./task-base";
import type { TaskError } from "./task-base";
import type { Checklist, ChecklistRequirement } from "@type/checklist";

const HARD_REQUIREMENT_WEIGHT = 3;
const SOFT_REQUIREMENT_WEIGHT = 1;
const PREFERRED_SKILL_WEIGHT = 1;

export class ScoreUpdatingTask extends BaseTask {
  readonly name = "score.updating" as const;

  private readonly checklistRepo = new ChecklistRepository(getDatabase());
  private readonly scoreRepo = new ScoreRepository(getDatabase());

  async run(jobId: string): Promise<TaskError | null> {
    const checklistRow = this.checklistRepo.findByJobId(jobId);

    if (!checklistRow?.checklist?.hardRequirements) {
      log.warn("Score update: no checklist found");
      this.scoreRepo.updateByJobId(jobId, { matchPercentage: 0 });
      return null;
    }

    const score = calculateScore(checklistRow.checklist);
    log.info(`Score: ${score}%`);

    this.scoreRepo.updateByJobId(jobId, { matchPercentage: score });
    return null;
  }
}

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

function calculateScore(checklist: Checklist): number {
  const results = [
    scoreFulfilledRequirements(
      checklist.hardRequirements,
      HARD_REQUIREMENT_WEIGHT,
    ),
    scoreFulfilledRequirements(
      checklist.softRequirements,
      SOFT_REQUIREMENT_WEIGHT,
    ),
    scoreFulfilledRequirements(
      checklist.preferredSkills,
      PREFERRED_SKILL_WEIGHT,
    ),
  ];

  const totalWeight = results.reduce((sum, r) => sum + r.totalWeight, 0);
  const matchedWeight = results.reduce((sum, r) => sum + r.matchedWeight, 0);

  let score = 0;
  if (totalWeight > 0) {
    score = Math.round((matchedWeight / totalWeight) * 100);
  }
  return Math.max(0, Math.min(100, score));
}
