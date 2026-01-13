import { OpenAIProvider } from './providers/openai.provider'
import { DeepSeekProvider } from './providers/deepseek.provider'
import { OllamaProvider } from './providers/ollama.provider'
import { XAIProvider } from './providers/xai.provider'
import { GeminiProvider } from './providers/gemini.provider'
import { AnthropicProvider } from './providers/anthropic.provider'
import type { AIProvider, AIProviderConfig } from './provider.interface'

export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case 'openai':
      return new OpenAIProvider(config)
    case 'deepseek':
      return new DeepSeekProvider(config)
    case 'ollama':
      return new OllamaProvider(config)
    case 'xai':
      return new XAIProvider(config)
    case 'gemini':
      return new GeminiProvider(config)
    case 'anthropic':
      return new AnthropicProvider(config)
    default:
      throw new Error(`Unknown provider type: ${config.type}`)
  }
}
