import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createMoonshotAI } from "@ai-sdk/moonshotai";
import { Output, generateText, streamText } from "ai";
import type { LanguageModel } from "ai";
import type { ZodType } from "zod";

export interface StructuredOutputRequest<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
  model: string;
  onPartial?: (partial: unknown) => void;
}

export interface AIProvider {
  generateStructuredOutput: <T>(
    params: StructuredOutputRequest<T>,
  ) => Promise<T>;
}

export interface AIProviderConfig {
  type: "openai" | "deepseek" | "xai" | "gemini" | "anthropic" | "moonshotai";
  apiKey?: string;
  baseUrl?: string;
}

type ModelFactory = (modelId: string) => LanguageModel;

class BaseProvider implements AIProvider {
  private readonly createModel: ModelFactory;

  constructor(createModel: ModelFactory) {
    this.createModel = createModel;
  }

  async generateStructuredOutput<T>(
    params: StructuredOutputRequest<T>,
  ): Promise<T> {
    const sdkParams = {
      model: this.createModel(params.model),
      output: Output.object({ schema: params.schema }),
      system: params.systemPrompt,
      prompt: params.userPrompt,
    };

    if (params.onPartial) {
      const { partialOutputStream, output } = streamText(sdkParams);
      for await (const partial of partialOutputStream) {
        params.onPartial(partial);
      }
      return await output;
    }

    const { output } = await generateText(sdkParams);
    return output;
  }
}

export function createAIProvider(config: AIProviderConfig): AIProvider {
  const { apiKey, baseUrl: baseURL } = config;
  switch (config.type) {
    case "openai":
      return new BaseProvider(createOpenAI({ apiKey, baseURL }));
    case "anthropic":
      return new BaseProvider(createAnthropic({ apiKey }));
    case "gemini":
      return new BaseProvider(createGoogleGenerativeAI({ apiKey, baseURL }));
    case "xai":
      return new BaseProvider(createXai({ apiKey, baseURL }));
    case "deepseek":
      return new BaseProvider(createDeepSeek({ apiKey, baseURL }));
    case "moonshotai":
      return new BaseProvider(createMoonshotAI({ apiKey, baseURL }));
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}
