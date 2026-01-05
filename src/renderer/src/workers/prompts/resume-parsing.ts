import { buildResumeZodSchema } from '@templates/schema-builder'
import type { AIProvider, DeepPartial } from '../../ai/provider.interface'

interface ParseOptions {
  streaming?: boolean
  onPartial?: (partial: DeepPartial<Record<string, unknown>>) => void
  model: string
}

export async function parseResume(
  provider: AIProvider,
  rawResumeContent: string,
  templateId: string,
  options: ParseOptions,
): Promise<Record<string, unknown>> {
  const systemPrompt =
    'Extract structured data from resumes. Only include factual information from the source.'
  const userPrompt = `Resume: ${rawResumeContent}`

  // Build Zod schema directly from templateId (no JSON conversion needed)
  const schema = buildResumeZodSchema(templateId)

  const params = {
    systemPrompt,
    userPrompt,
    schema,
    model: options.model,
  }

  if (options.streaming && options.onPartial) {
    return provider.streamStructuredOutput({
      ...params,
      onPartial: options.onPartial,
    })
  }

  return provider.generateStructuredOutput(params)
}
