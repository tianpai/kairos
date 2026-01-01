import { generateObject, streamObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type {
  AIProvider,
  AIProviderConfig,
  GenerateParams,
  StreamParams,
} from '../provider.interface'

export class OpenAIProvider implements AIProvider {
  private readonly openai: ReturnType<typeof createOpenAI>
  private readonly defaultModel: string

  constructor(config: AIProviderConfig) {
    this.openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    })
    this.defaultModel = config.defaultModel ?? 'gpt-4o'
  }

  async generateStructuredOutput<T>(params: GenerateParams<T>): Promise<T> {
    const { object } = await generateObject({
      model: this.openai(params.model ?? this.defaultModel),
      schema: params.schema,
      system: params.systemPrompt,
      prompt: params.userPrompt,
    })
    return object
  }

  async streamStructuredOutput<T>(params: StreamParams<T>): Promise<T> {
    const { partialObjectStream, object } = streamObject({
      model: this.openai(params.model ?? this.defaultModel),
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
