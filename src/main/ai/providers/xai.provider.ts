import { generateObject, streamObject } from 'ai'
import { createXai } from '@ai-sdk/xai'
import type {
  AIProvider,
  AIProviderConfig,
  GenerateParams,
  StreamParams,
} from '../provider.interface'

export class XAIProvider implements AIProvider {
  private readonly client: ReturnType<typeof createXai>
  private readonly defaultModel: string

  constructor(config: AIProviderConfig) {
    this.client = createXai({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    })
    this.defaultModel = config.defaultModel ?? 'grok-3-fast'
  }

  async generateStructuredOutput<T>(params: GenerateParams<T>): Promise<T> {
    const { object } = await generateObject({
      model: this.client(params.model ?? this.defaultModel),
      schema: params.schema,
      system: params.systemPrompt,
      prompt: params.userPrompt,
    })
    return object
  }

  async streamStructuredOutput<T>(params: StreamParams<T>): Promise<T> {
    const { partialObjectStream, object } = streamObject({
      model: this.client(params.model ?? this.defaultModel),
      schema: params.schema,
      system: params.systemPrompt,
      prompt: params.userPrompt,
    })

    if (params.onPartial) {
      for await (const partial of partialObjectStream) {
        params.onPartial(partial)
      }
    }

    return await object
  }
}
