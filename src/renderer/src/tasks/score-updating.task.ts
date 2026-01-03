import log from 'electron-log/renderer'
import { getJobApplication, saveMatchScore } from '@api/jobs'
import { SCORE_UPDATING } from '../workflow/workflow.types'
import { BaseTask } from './base.task'
import type { Checklist, ChecklistRequirement } from '@type/checklist'
import type { TaskTypeMap } from './base.task'

const HARD_REQUIREMENT_WEIGHT = 3
const SOFT_REQUIREMENT_WEIGHT = 1
const PREFERRED_SKILL_WEIGHT = 1

function scoreFulfilledRequirements(
  requirements: Array<ChecklistRequirement>,
  baseWeight: number,
): { totalWeight: number; matchedWeight: number } {
  let totalWeight = 0
  let matchedWeight = 0

  for (const req of requirements) {
    totalWeight += baseWeight
    if (req.fulfilled === true) {
      matchedWeight += baseWeight
    }
  }

  return { totalWeight, matchedWeight }
}

export function calculateScore(checklist: Checklist): number {
  let totalWeight = 0
  let matchedWeight = 0

  const hardResults = scoreFulfilledRequirements(
    checklist.hardRequirements,
    HARD_REQUIREMENT_WEIGHT,
  )
  totalWeight += hardResults.totalWeight
  matchedWeight += hardResults.matchedWeight

  const softResults = scoreFulfilledRequirements(
    checklist.softRequirements,
    SOFT_REQUIREMENT_WEIGHT,
  )
  totalWeight += softResults.totalWeight
  matchedWeight += softResults.matchedWeight

  const preferredResults = scoreFulfilledRequirements(
    checklist.preferredSkills,
    PREFERRED_SKILL_WEIGHT,
  )
  totalWeight += preferredResults.totalWeight
  matchedWeight += preferredResults.matchedWeight

  const score =
    totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0
  return Math.max(0, Math.min(100, score))
}

class ScoreUpdatingTask extends BaseTask<typeof SCORE_UPDATING> {
  readonly name = SCORE_UPDATING
  readonly inputKeys = ['jobId'] as const
  readonly tipEvent = 'score.updated'

  getTipData(result: number): Record<string, unknown> {
    return { score: result }
  }

  async execute(
    input: TaskTypeMap[typeof SCORE_UPDATING]['input'],
  ): Promise<TaskTypeMap[typeof SCORE_UPDATING]['output']> {
    const job = await getJobApplication(input.jobId)

    const checklist = job.checklist
    if (!checklist) {
      log.warn('Score update: no checklist found')
      return 0
    }

    const score = calculateScore(checklist)
    log.info(`Score calculated: ${score}%`)
    return score
  }

  async onSuccess(
    jobId: string,
    matchPercentage: TaskTypeMap[typeof SCORE_UPDATING]['output'],
  ): Promise<void> {
    await saveMatchScore(jobId, matchPercentage)
    log.info(`Score saved: ${matchPercentage}% for job ${jobId}`)
  }
}

export const scoreUpdatingTask = new ScoreUpdatingTask()
