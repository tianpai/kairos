import type { ProviderType } from '../../../shared/providers'
import type { OllamaPullProgress } from '../../../shared/ollama'

export interface ModelInfo {
  id: string
  name: string
}

type ApiKeyProvider = Exclude<ProviderType, 'ollama'>

type ApiKeyOps = {
  has: () => Promise<boolean>
  get: () => Promise<string | null>
  set: (key: string) => Promise<void>
  delete: () => Promise<void>
}

const apiKeyOperations: Record<ApiKeyProvider, ApiKeyOps> = {
  openai: {
    has: () => window.kairos.settings.hasApiKey(),
    get: () => window.kairos.settings.getApiKey(),
    set: (key) => window.kairos.settings.setApiKey(key),
    delete: () => window.kairos.settings.deleteApiKey(),
  },
  deepseek: {
    has: () => window.kairos.settings.hasDeepSeekApiKey(),
    get: () => window.kairos.settings.getDeepSeekApiKey(),
    set: (key) => window.kairos.settings.setDeepSeekApiKey(key),
    delete: () => window.kairos.settings.deleteDeepSeekApiKey(),
  },
  xai: {
    has: () => window.kairos.settings.hasXAIApiKey(),
    get: () => window.kairos.settings.getXAIApiKey(),
    set: (key) => window.kairos.settings.setXAIApiKey(key),
    delete: () => window.kairos.settings.deleteXAIApiKey(),
  },
  gemini: {
    has: () => window.kairos.settings.hasGeminiApiKey(),
    get: () => window.kairos.settings.getGeminiApiKey(),
    set: (key) => window.kairos.settings.setGeminiApiKey(key),
    delete: () => window.kairos.settings.deleteGeminiApiKey(),
  },
  anthropic: {
    has: () => window.kairos.settings.hasAnthropicApiKey(),
    get: () => window.kairos.settings.getAnthropicApiKey(),
    set: (key) => window.kairos.settings.setAnthropicApiKey(key),
    delete: () => window.kairos.settings.deleteAnthropicApiKey(),
  },
}

export function hasProviderApiKey(provider: ApiKeyProvider): Promise<boolean> {
  return apiKeyOperations[provider].has()
}

export function getProviderApiKey(
  provider: ApiKeyProvider,
): Promise<string | null> {
  return apiKeyOperations[provider].get()
}

export function setProviderApiKey(
  provider: ApiKeyProvider,
  key: string,
): Promise<void> {
  return apiKeyOperations[provider].set(key)
}

export function deleteProviderApiKey(provider: ApiKeyProvider): Promise<void> {
  return apiKeyOperations[provider].delete()
}

export function resetAllProviderSettings(): Promise<{ success: boolean }> {
  return window.kairos.settings.resetAllProviders()
}

export function fetchModels(provider: ProviderType): Promise<ModelInfo[]> {
  return window.kairos.models.fetch(provider)
}

export function getSelectedModel(
  provider: ProviderType,
): Promise<string | null> {
  return window.kairos.models.getSelected(provider)
}

export function setSelectedModel(
  provider: ProviderType,
  model: string,
): Promise<void> {
  return window.kairos.models.setSelected(provider, model)
}

export function getDefaultModel(provider: ProviderType): Promise<string> {
  return window.kairos.models.getDefault(provider)
}

export function getActiveProvider(): Promise<ProviderType> {
  return window.kairos.provider.getActive()
}

export function setActiveProvider(provider: ProviderType): Promise<void> {
  return window.kairos.provider.setActive(provider)
}

export function getOllamaStatus(): Promise<{
  running: boolean
  version: string | null
}> {
  return Promise.all([
    window.kairos.ollama.isRunning(),
    window.kairos.ollama.getVersion(),
  ]).then(([running, version]) => ({ running, version }))
}

export function getOllamaInstalledModels(): Promise<ModelInfo[]> {
  return window.kairos.ollama.getInstalledModels()
}

export function getOllamaCuratedModels(): Promise<ModelInfo[]> {
  return window.kairos.ollama.getCuratedModels()
}

export function pullOllamaModel(
  modelName: string,
): Promise<{ success: boolean; error?: string }> {
  return window.kairos.ollama.pullModel(modelName)
}

export function cancelOllamaPull(): Promise<void> {
  return window.kairos.ollama.cancelPull()
}

export function getOllamaBaseUrl(): Promise<string> {
  return window.kairos.ollama.getBaseUrl()
}

export function setOllamaBaseUrl(url: string): Promise<void> {
  return window.kairos.ollama.setBaseUrl(url)
}

export function onOllamaPullProgress(
  callback: (data: { modelName: string; progress: OllamaPullProgress }) => void,
): () => void {
  return window.kairos.ollama.onPullProgress(callback)
}
