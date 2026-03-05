import { generateObject, streamObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type {
  AIProvider,
  AIProviderConfig,
  GenerateParams,
  StreamParams,
} from "../provider.interface";

export class AnthropicProvider implements AIProvider {
  private readonly anthropic: ReturnType<typeof createAnthropic>;
  private readonly defaultModel: string;

  constructor(config: AIProviderConfig) {
    this.anthropic = createAnthropic({
      apiKey: config.apiKey,
    });
    this.defaultModel = config.defaultModel ?? "claude-haiku-4-5-20251001";
  }

  async generateStructuredOutput<T>(params: GenerateParams<T>): Promise<T> {
    const { object } = await generateObject({
      model: this.anthropic(params.model ?? this.defaultModel),
      schema: params.schema,
      system: params.systemPrompt,
      prompt: params.userPrompt,
    });
    return object;
  }

  async streamStructuredOutput<T>(params: StreamParams<T>): Promise<T> {
    const { partialObjectStream, object } = streamObject({
      model: this.anthropic(params.model ?? this.defaultModel),
      schema: params.schema,
      system: params.systemPrompt,
      prompt: params.userPrompt,
    });

    if (params.onPartial) {
      for await (const partial of partialObjectStream) {
        params.onPartial(partial);
      }
    }

    return await object;
  }
}
