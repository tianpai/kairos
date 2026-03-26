import type { ProviderType } from '../../../shared/providers'

export interface ModelInfo {
  id: string
  name: string
}

export function hasProviderApiKey(provider: ProviderType): Promise<boolean> {
  return window.kairos.apiKey.has(provider)
}

export function getProviderApiKey(
  provider: ProviderType,
): Promise<string | null> {
  return window.kairos.apiKey.get(provider)
}

export function setProviderApiKey(
  provider: ProviderType,
  key: string,
): Promise<void> {
  return window.kairos.apiKey.set(provider, key)
}

export function deleteProviderApiKey(provider: ProviderType): Promise<void> {
  return window.kairos.apiKey.delete(provider)
}

export function resetAllProviderSettings(): Promise<{ success: boolean }> {
  return window.kairos.provider.resetAll()
}

export function fetchModels(provider: ProviderType): Promise<ModelInfo[]> {
  return window.kairos.provider.fetchModels(provider)
}

export function getSelectedModel(
  provider: ProviderType,
): Promise<string | null> {
  return window.kairos.provider.getSelectedModel(provider)
}

export function setSelectedModel(
  provider: ProviderType,
  model: string,
): Promise<void> {
  return window.kairos.provider.setSelectedModel(provider, model)
}

export function getActiveProvider(): Promise<ProviderType | null> {
  return window.kairos.provider.getActive()
}

export function setActiveProvider(provider: ProviderType): Promise<void> {
  return window.kairos.provider.setActive(provider)
}

export async function hasActiveProviderApiKey(): Promise<boolean> {
  const activeProvider = await getActiveProvider()
  if (!activeProvider) return false
  return hasProviderApiKey(activeProvider)
}
