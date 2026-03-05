import { OpenAIProvider } from "./openai.provider";
import { DeepSeekProvider } from "./deepseek.provider";
import { XAIProvider } from "./xai.provider";
import { GeminiProvider } from "./gemini.provider";
import { AnthropicProvider } from "./anthropic.provider";
import type { AIProvider, AIProviderConfig } from "./provider.interface";

export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case "openai":
      return new OpenAIProvider(config);
    case "deepseek":
      return new DeepSeekProvider(config);
    case "xai":
      return new XAIProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}
