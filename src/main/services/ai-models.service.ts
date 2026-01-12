import type { ProviderType } from "../../shared/providers"

export interface ModelInfo {
  id: string
  name: string
  owned_by?: string
}

// Fallback models when API call fails
const OPENAI_FALLBACK_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
]

const DEEPSEEK_FALLBACK_MODELS = [
  "deepseek-chat",
  "deepseek-reasoner",
]

const XAI_FALLBACK_MODELS = [
  "grok-3-fast",
  "grok-3",
  "grok-3-mini-fast",
  "grok-3-mini",
  "grok-2-1212",
]

const GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
]

const ANTHROPIC_FALLBACK_MODELS: Array<ModelInfo> = [
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
]

// Claude models are hardcoded (OAuth doesn't provide a model list endpoint)
const CLAUDE_MODELS: Array<ModelInfo> = [
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
]

// Ollama curated models (known good for structured output)
const OLLAMA_CURATED_MODELS: Array<ModelInfo> = [
  { id: "llama3.2:3b", name: "Llama 3.2 3B (Recommended)" },
  { id: "llama3.1:8b", name: "Llama 3.1 8B" },
  { id: "qwen2.5:7b", name: "Qwen 2.5 7B" },
  { id: "mistral:7b", name: "Mistral 7B" },
  { id: "gemma2:9b", name: "Gemma 2 9B" },
]

// Filter patterns for chat models (exclude embeddings, tts, whisper, dall-e, etc.)
const OPENAI_CHAT_MODEL_PATTERNS = [
  /^gpt-4/,
  /^gpt-3\.5/,
  /^o1/,
  /^o3/,
  /^chatgpt/,
]

function isOpenAIChatModel(modelId: string): boolean {
  return OPENAI_CHAT_MODEL_PATTERNS.some((pattern) => pattern.test(modelId))
}

export async function fetchOpenAIModels(
  apiKey: string,
  baseUrl = "https://api.openai.com/v1",
): Promise<Array<ModelInfo>> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`OpenAI models fetch failed: ${response.status}`)
      return OPENAI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
    }

    const data = (await response.json()) as { data: Array<{ id: string; owned_by?: string }> }
    const chatModels = data.data
      .filter((m) => isOpenAIChatModel(m.id))
      .map((m) => ({
        id: m.id,
        name: m.id,
        owned_by: m.owned_by,
      }))
      .sort((a, b) => a.id.localeCompare(b.id))

    return chatModels.length > 0
      ? chatModels
      : OPENAI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
  } catch (error) {
    console.error("Failed to fetch OpenAI models:", error)
    return OPENAI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
  }
}

export async function fetchDeepSeekModels(
  apiKey: string,
  baseUrl = "https://api.deepseek.com/v1",
): Promise<Array<ModelInfo>> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`DeepSeek models fetch failed: ${response.status}`)
      return DEEPSEEK_FALLBACK_MODELS.map((id) => ({ id, name: id }))
    }

    const data = (await response.json()) as { data: Array<{ id: string; owned_by?: string }> }
    const models = data.data.map((m) => ({
      id: m.id,
      name: m.id,
      owned_by: m.owned_by,
    }))

    return models.length > 0
      ? models
      : DEEPSEEK_FALLBACK_MODELS.map((id) => ({ id, name: id }))
  } catch (error) {
    console.error("Failed to fetch DeepSeek models:", error)
    return DEEPSEEK_FALLBACK_MODELS.map((id) => ({ id, name: id }))
  }
}

export async function fetchXAIModels(
  apiKey: string,
  baseUrl = "https://api.x.ai/v1",
): Promise<Array<ModelInfo>> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`xAI models fetch failed: ${response.status}`)
      return XAI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
    }

    const data = (await response.json()) as { data: Array<{ id: string; owned_by?: string }> }
    const models = data.data.map((m) => ({
      id: m.id,
      name: m.id,
      owned_by: m.owned_by,
    }))

    return models.length > 0
      ? models
      : XAI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
  } catch (error) {
    console.error("Failed to fetch xAI models:", error)
    return XAI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
  }
}

export async function fetchGeminiModels(
  apiKey: string,
  baseUrl = "https://generativelanguage.googleapis.com/v1beta",
): Promise<Array<ModelInfo>> {
  try {
    const response = await fetch(`${baseUrl}/models?key=${apiKey}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Gemini models fetch failed: ${response.status}`)
      return GEMINI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
    }

    const data = (await response.json()) as { models: Array<{ name: string; displayName: string }> }
    // Filter for generative models only (exclude embedding models, etc.)
    const generativeModels = data.models
      .filter((m) => m.name.includes("gemini"))
      .map((m) => ({
        id: m.name.replace("models/", ""),
        name: m.displayName || m.name.replace("models/", ""),
      }))
      .sort((a, b) => a.id.localeCompare(b.id))

    return generativeModels.length > 0
      ? generativeModels
      : GEMINI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
  } catch (error) {
    console.error("Failed to fetch Gemini models:", error)
    return GEMINI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
  }
}

export async function fetchAnthropicModels(
  apiKey: string,
  baseUrl = "https://api.anthropic.com/v1",
): Promise<Array<ModelInfo>> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    })

    if (!response.ok) {
      console.error(`Anthropic models fetch failed: ${response.status}`)
      return ANTHROPIC_FALLBACK_MODELS
    }

    const data = (await response.json()) as {
      data: Array<{ id: string; display_name: string; type: string; created_at: string }>
      has_more: boolean
    }
    const models = data.data.map((m) => ({
      id: m.id,
      name: m.display_name,
    }))

    return models.length > 0 ? models : ANTHROPIC_FALLBACK_MODELS
  } catch (error) {
    console.error("Failed to fetch Anthropic models:", error)
    return ANTHROPIC_FALLBACK_MODELS
  }
}

export function getClaudeModels(): Array<ModelInfo> {
  return CLAUDE_MODELS
}

export function getOllamaCuratedModels(): Array<ModelInfo> {
  return OLLAMA_CURATED_MODELS
}

export function getFallbackModels(provider: ProviderType): Array<ModelInfo> {
  switch (provider) {
    case "openai":
      return OPENAI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
    case "deepseek":
      return DEEPSEEK_FALLBACK_MODELS.map((id) => ({ id, name: id }))
    case "xai":
      return XAI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
    case "gemini":
      return GEMINI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
    case "claude":
      return CLAUDE_MODELS
    case "ollama":
      return OLLAMA_CURATED_MODELS
    case "anthropic":
      return ANTHROPIC_FALLBACK_MODELS
    default:
      return []
  }
}

export function getDefaultModel(provider: ProviderType): string {
  switch (provider) {
    case "openai":
      return "gpt-4o-mini"
    case "deepseek":
      return "deepseek-chat"
    case "xai":
      return "grok-3-fast"
    case "gemini":
      return "gemini-2.5-flash"
    case "claude":
      return "claude-sonnet-4-5-20250929"
    case "ollama":
      return "llama3.2:3b"
    case "anthropic":
      return "claude-haiku-4-5-20251001"
    default:
      return "gpt-4o-mini"
  }
}
