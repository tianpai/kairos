export interface AIProvider {
  generateStructuredOutput: <T = Record<string, unknown>>(params: {
    systemPrompt: string
    userPrompt: string
    jsonSchema: Record<string, unknown>
    schemaName: string
    model?: string
  }) => Promise<T>
}

export interface AIProviderConfig {
  type: 'openai' | 'ollama'
  apiKey?: string
  baseUrl?: string
  defaultModel?: string
}
