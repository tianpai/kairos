import { OpenAIProvider } from './providers/openai.provider'
import type { AIProvider, AIProviderConfig } from './provider.interface'

export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case 'openai':
      return new OpenAIProvider(config)
    default:
      throw new Error(`Unknown provider type: ${config.type}`)
  }
}
