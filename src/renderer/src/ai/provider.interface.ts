import type { ZodSchema } from 'zod'

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

export interface GenerateParams<T> {
  systemPrompt: string
  userPrompt: string
  schema: ZodSchema<T>
  model?: string
}

export interface StreamParams<T> extends GenerateParams<T> {
  onPartial?: (partial: DeepPartial<T>) => void
}

export interface AIProvider {
  generateStructuredOutput: <T>(params: GenerateParams<T>) => Promise<T>
  streamStructuredOutput: <T>(params: StreamParams<T>) => Promise<T>
}

export interface AIProviderConfig {
  type: 'openai'
  apiKey?: string
  baseUrl?: string
  defaultModel?: string
}
