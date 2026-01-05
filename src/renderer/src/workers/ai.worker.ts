import { createAIProvider } from '../ai/provider.factory'
import {
  CHECKLIST_MATCHING,
  CHECKLIST_PARSING,
  JOBINFO_EXTRACTING,
  RESUME_PARSING,
  RESUME_TAILORING,
} from '../workflow/task-names'
import { parseResume } from './prompts/resume-parsing'
import { parseChecklist } from './prompts/checklist-parsing'
import { matchChecklist } from './prompts/checklist-matching'
import { tailorResume } from './prompts/resume-tailoring'
import { extractJobInfo } from './prompts/jobinfo-extracting'
import type { TaskName } from '../workflow/task-contracts'

export type AITaskType = TaskName

export interface AIWorkerMessage {
  id: string
  taskType: AITaskType
  payload: Record<string, unknown>
  apiKey: string
  model: string
  streaming?: boolean
}

export type AIWorkerResponse =
  | { id: string; type: 'partial'; partial: unknown }
  | { id: string; type: 'completed'; result: unknown }
  | { id: string; type: 'failed'; error: string }

self.onmessage = async ({ data }: MessageEvent<AIWorkerMessage>) => {
  const { id, taskType, payload, apiKey, model, streaming = false } = data

  try {
    const provider = createAIProvider({ type: 'openai', apiKey })

    // Create partial handler for streaming
    const onPartial = streaming
      ? (partial: unknown) => {
          self.postMessage({ id, type: 'partial', partial } satisfies AIWorkerResponse)
        }
      : undefined

    let result: unknown
    switch (taskType) {
      case RESUME_PARSING:
        result = await parseResume(
          provider,
          payload.rawResumeContent as string,
          payload.templateId as string,
          { streaming, onPartial, model },
        )
        break
      case CHECKLIST_PARSING:
        result = await parseChecklist(provider, payload.jobDescription as string, {
          streaming,
          onPartial,
          model,
        })
        break
      case CHECKLIST_MATCHING:
        result = await matchChecklist(
          provider,
          payload.checklist as Parameters<typeof matchChecklist>[1],
          payload.resumeStructure as Record<string, unknown>,
          { streaming, onPartial, model },
        )
        break
      case RESUME_TAILORING:
        result = await tailorResume(
          provider,
          payload.checklist as Parameters<typeof tailorResume>[1],
          payload.resumeStructure as Record<string, unknown>,
          payload.templateId as string,
          { streaming, onPartial, model },
        )
        break
      case JOBINFO_EXTRACTING:
        result = await extractJobInfo(provider, payload.jobDescription as string, {
          streaming,
          onPartial,
          model,
        })
        break
      default:
        throw new Error(`Unknown task type: ${taskType}`)
    }

    self.postMessage({
      id,
      type: 'completed',
      result,
    } satisfies AIWorkerResponse)
  } catch (error) {
    self.postMessage({
      id,
      type: 'failed',
      error: error instanceof Error ? error.message : String(error),
    } satisfies AIWorkerResponse)
  }
}
