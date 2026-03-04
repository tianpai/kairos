import type { ProviderType } from '../../../shared/providers'

export interface ModelInfo {
  id: string
  name: string
}

type ApiKeyOps = {
  has: () => Promise<boolean>
  get: () => Promise<string | null>
  set: (key: string) => Promise<void>
  delete: () => Promise<void>
}

const apiKeyOperations: Record<ProviderType, ApiKeyOps> = {
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

export function hasProviderApiKey(provider: ProviderType): Promise<boolean> {
  return apiKeyOperations[provider].has()
}

export function getProviderApiKey(
  provider: ProviderType,
): Promise<string | null> {
  return apiKeyOperations[provider].get()
}

export function setProviderApiKey(
  provider: ProviderType,
  key: string,
): Promise<void> {
  return apiKeyOperations[provider].set(key)
}

export function deleteProviderApiKey(provider: ProviderType): Promise<void> {
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

