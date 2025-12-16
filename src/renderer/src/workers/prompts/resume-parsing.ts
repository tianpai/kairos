import type { AIProvider } from '../../ai/provider.interface'

export async function parseResume(
  provider: AIProvider,
  rawResumeContent: string,
  jsonSchema: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const systemPrompt =
    'Extract structured data from resumes. Only include factual information from the source.'
  const userPrompt = `Resume: ${rawResumeContent}`

  return provider.generateStructuredOutput({
    systemPrompt,
    userPrompt,
    jsonSchema,
    schemaName: 'resume_structure',
    model: 'gpt-4o-mini',
  })
}
