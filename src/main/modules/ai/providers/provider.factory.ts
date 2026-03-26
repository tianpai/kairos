import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { BaseProvider } from "./base.provider";
import type { AIProvider, AIProviderConfig } from "./provider.interface";

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
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}
