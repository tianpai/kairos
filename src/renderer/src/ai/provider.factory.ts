import { OpenAIProvider } from './providers/openai.provider'
import type { AIProvider, AIProviderConfig } from './provider.interface'

export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case 'openai':
      return new OpenAIProvider(config)
    case 'ollama':
      throw new Error('Ollama not yet implemented')
    default:
      throw new Error(`Unknown provider type: ${config.type}`)
  }
}
