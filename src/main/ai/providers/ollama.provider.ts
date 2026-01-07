import { generateObject, streamObject } from "ai"
import { ollama } from "ai-sdk-ollama"
import type {
  AIProvider,
  AIProviderConfig,
  GenerateParams,
  StreamParams,
} from "../provider.interface"

export class OllamaProvider implements AIProvider {
  private readonly defaultModel: string

  constructor(config: AIProviderConfig) {
    this.defaultModel = config.defaultModel ?? "llama3.2:3b"
  }

  async generateStructuredOutput<T>(params: GenerateParams<T>): Promise<T> {
    const { object } = await generateObject({
      model: ollama(params.model ?? this.defaultModel),
      schema: params.schema,
      system: params.systemPrompt,
      prompt: params.userPrompt,
    })
    return object
  }

  async streamStructuredOutput<T>(params: StreamParams<T>): Promise<T> {
    const { partialObjectStream, object } = streamObject({
      model: ollama(params.model ?? this.defaultModel),
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
