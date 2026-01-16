import { generateObject, streamObject } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import type {
  AIProvider,
  AIProviderConfig,
  GenerateParams,
  StreamParams,
} from "../provider.interface";

export class DeepSeekProvider implements AIProvider {
  private readonly client: ReturnType<typeof createDeepSeek>;
  private readonly defaultModel: string;

  constructor(config: AIProviderConfig) {
    this.client = createDeepSeek({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.defaultModel = config.defaultModel ?? "deepseek-chat";
  }

  async generateStructuredOutput<T>(params: GenerateParams<T>): Promise<T> {
    const { object } = await generateObject({
      model: this.client(params.model ?? this.defaultModel),
      schema: params.schema,
      system: params.systemPrompt,
      prompt: params.userPrompt,
    });
    return object;
  }

  async streamStructuredOutput<T>(params: StreamParams<T>): Promise<T> {
    const { partialObjectStream, object } = streamObject({
      model: this.client(params.model ?? this.defaultModel),
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
