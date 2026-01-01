import { createAIProvider } from '../ai/provider.factory'
import { parseResume } from './prompts/resume-parsing'
import { parseChecklist } from './prompts/checklist-parsing'
import { matchChecklist } from './prompts/checklist-matching'
import { tailorResume } from './prompts/resume-tailoring'
import { extractJobInfo } from './prompts/jobinfo-extracting'

export type AITaskType =
  | 'resume.parsing'
  | 'checklist.parsing'
  | 'checklist.matching'
  | 'resume.tailoring'
  | 'jobinfo.extracting'

export interface AIWorkerMessage {
  id: string
  taskType: AITaskType
  payload: Record<string, unknown>
  apiKey: string
  streaming?: boolean
}

export type AIWorkerResponse =
  | { id: string; type: 'partial'; partial: unknown }
  | { id: string; type: 'completed'; result: unknown }
  | { id: string; type: 'failed'; error: string }

self.onmessage = async ({ data }: MessageEvent<AIWorkerMessage>) => {
  const { id, taskType, payload, apiKey, streaming = false } = data

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
      case 'resume.parsing':
        result = await parseResume(
          provider,
          payload.rawResumeContent as string,
          payload.templateId as string,
          { streaming, onPartial },
        )
        break
      case 'checklist.parsing':
        result = await parseChecklist(provider, payload.jobDescription as string, {
          streaming,
          onPartial,
        })
        break
      case 'checklist.matching':
        result = await matchChecklist(
          provider,
          payload.checklist as Parameters<typeof matchChecklist>[1],
          payload.resumeStructure as Record<string, unknown>,
          { streaming, onPartial },
        )
        break
      case 'resume.tailoring':
        result = await tailorResume(
          provider,
          payload.checklist as Parameters<typeof tailorResume>[1],
          payload.resumeStructure as Record<string, unknown>,
          payload.templateId as string,
          { streaming, onPartial },
        )
        break
      case 'jobinfo.extracting':
        result = await extractJobInfo(provider, payload.jobDescription as string, {
          streaming,
          onPartial,
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
