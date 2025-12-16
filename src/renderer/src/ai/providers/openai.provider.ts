import OpenAI from 'openai'
import type { AIProvider, AIProviderConfig } from '../provider.interface'

export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI
  private readonly defaultModel: string

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      maxRetries: 0,
      dangerouslyAllowBrowser: true,
    })
    this.defaultModel = config.defaultModel ?? 'gpt-4o'
  }

  async generateStructuredOutput<T = Record<string, unknown>>(params: {
    systemPrompt: string
    userPrompt: string
    jsonSchema: Record<string, unknown>
    schemaName: string
    model?: string
  }): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: params.model ?? this.defaultModel,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: params.schemaName,
          schema: params.jsonSchema,
          strict: true,
        },
      },
    })

    const content = response.choices[0].message.content

    if (content === null) {
      throw new Error('OpenAI returned empty response')
    }

    return JSON.parse(content) as T
  }
}
