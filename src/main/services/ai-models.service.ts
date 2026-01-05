export type ProviderType = "openai" | "deepseek" | "claude"

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

// Claude models are hardcoded (OAuth doesn't provide a model list endpoint)
const CLAUDE_MODELS: ModelInfo[] = [
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
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
): Promise<ModelInfo[]> {
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
): Promise<ModelInfo[]> {
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

export function getClaudeModels(): ModelInfo[] {
  return CLAUDE_MODELS
}

export function getFallbackModels(provider: ProviderType): ModelInfo[] {
  switch (provider) {
    case "openai":
      return OPENAI_FALLBACK_MODELS.map((id) => ({ id, name: id }))
    case "deepseek":
      return DEEPSEEK_FALLBACK_MODELS.map((id) => ({ id, name: id }))
    case "claude":
      return CLAUDE_MODELS
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
    case "claude":
      return "claude-sonnet-4-5-20250929"
    default:
      return "gpt-4o-mini"
  }
}
