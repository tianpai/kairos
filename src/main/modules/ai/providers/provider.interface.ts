import type { ZodType } from "zod";
import type { DeepPartial } from "ai";

export type { DeepPartial };

export interface GenerateParams<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
  model: string;
}

export interface StreamParams<T> extends GenerateParams<T> {
  onPartial?: (partial: DeepPartial<T>) => void;
}

export interface AIProvider {
  generateStructuredOutput: <T>(params: GenerateParams<T>) => Promise<T>;
  streamStructuredOutput: <T>(params: StreamParams<T>) => Promise<T>;
}

export interface AIProviderConfig {
  type: "openai" | "deepseek" | "xai" | "gemini" | "anthropic";
  apiKey?: string;
  baseUrl?: string;
}
