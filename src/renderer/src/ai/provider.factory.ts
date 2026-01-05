import { OpenAIProvider } from './providers/openai.provider'
import { DeepSeekProvider } from './providers/deepseek.provider'
import type { AIProvider, AIProviderConfig } from './provider.interface'

export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case 'openai':
      return new OpenAIProvider(config)
    case 'deepseek':
      return new DeepSeekProvider(config)
    default:
      throw new Error(`Unknown provider type: ${config.type}`)
  }
}
