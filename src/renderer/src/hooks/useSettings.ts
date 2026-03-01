import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelOllamaPull,
  deleteProviderApiKey,
  fetchModels,
  getActiveProvider,
  getDefaultModel,
  getOllamaBaseUrl,
  getOllamaCuratedModels,
  getOllamaInstalledModels,
  getOllamaStatus,
  getProviderApiKey,
  getSelectedModel,
  hasProviderApiKey,
  pullOllamaModel,
  setActiveProvider,
  setOllamaBaseUrl,
  setProviderApiKey,
  setSelectedModel,
} from '@api/settings'
import type { ProviderType } from '../../../shared/providers'

type ApiKeyProvider = Exclude<ProviderType, 'ollama'>

function useHasProviderApiKey(provider: ApiKeyProvider, queryKeySuffix: string) {
  return useQuery({
    queryKey: ['settings', queryKeySuffix],
    queryFn: () => hasProviderApiKey(provider),
  })
}

function useProviderApiKey(provider: ApiKeyProvider, queryKeySuffix: string) {
  return useQuery({
    queryKey: ['settings', queryKeySuffix],
    queryFn: () => getProviderApiKey(provider),
  })
}

function useSetProviderApiKey(provider: ApiKeyProvider) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => setProviderApiKey(provider, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

function useDeleteProviderApiKey(provider: ApiKeyProvider) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteProviderApiKey(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// OpenAI API Key hooks
export function useHasApiKey() {
  return useHasProviderApiKey('openai', 'hasApiKey')
}

export function useApiKey() {
  return useProviderApiKey('openai', 'apiKey')
}

export function useSetApiKey() {
  return useSetProviderApiKey('openai')
}

export function useDeleteApiKey() {
  return useDeleteProviderApiKey('openai')
}

// DeepSeek API Key hooks
export function useHasDeepSeekApiKey() {
  return useHasProviderApiKey('deepseek', 'hasDeepSeekApiKey')
}

export function useDeepSeekApiKey() {
  return useProviderApiKey('deepseek', 'deepSeekApiKey')
}

export function useSetDeepSeekApiKey() {
  return useSetProviderApiKey('deepseek')
}

export function useDeleteDeepSeekApiKey() {
  return useDeleteProviderApiKey('deepseek')
}

// xAI API Key hooks
export function useHasXAIApiKey() {
  return useHasProviderApiKey('xai', 'hasXAIApiKey')
}

export function useXAIApiKey() {
  return useProviderApiKey('xai', 'xaiApiKey')
}

export function useSetXAIApiKey() {
  return useSetProviderApiKey('xai')
}

export function useDeleteXAIApiKey() {
  return useDeleteProviderApiKey('xai')
}

// Gemini API Key hooks
export function useHasGeminiApiKey() {
  return useHasProviderApiKey('gemini', 'hasGeminiApiKey')
}

export function useGeminiApiKey() {
  return useProviderApiKey('gemini', 'geminiApiKey')
}

export function useSetGeminiApiKey() {
  return useSetProviderApiKey('gemini')
}

export function useDeleteGeminiApiKey() {
  return useDeleteProviderApiKey('gemini')
}

// Anthropic API Key hooks
export function useHasAnthropicApiKey() {
  return useHasProviderApiKey('anthropic', 'hasAnthropicApiKey')
}

export function useAnthropicApiKey() {
  return useProviderApiKey('anthropic', 'anthropicApiKey')
}

export function useSetAnthropicApiKey() {
  return useSetProviderApiKey('anthropic')
}

export function useDeleteAnthropicApiKey() {
  return useDeleteProviderApiKey('anthropic')
}

// Model hooks
export function useFetchModels(provider: ProviderType) {
  return useQuery({
    queryKey: ['models', provider],
    queryFn: () => fetchModels(provider),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSelectedModel(provider: ProviderType) {
  return useQuery({
    queryKey: ['models', 'selected', provider],
    queryFn: () => getSelectedModel(provider),
  })
}

export function useSetSelectedModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      provider,
      model,
    }: {
      provider: ProviderType
      model: string
    }) => setSelectedModel(provider, model),
    onSuccess: (_, { provider }) => {
      queryClient.invalidateQueries({
        queryKey: ['models', 'selected', provider],
      })
    },
  })
}

export function useDefaultModel(provider: ProviderType) {
  return useQuery({
    queryKey: ['models', 'default', provider],
    queryFn: () => getDefaultModel(provider),
  })
}

// Provider hooks
export function useActiveProvider() {
  return useQuery({
    queryKey: ['provider', 'active'],
    queryFn: getActiveProvider,
  })
}

export function useSetActiveProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (provider: ProviderType) => setActiveProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'hasApiKey'] })
    },
  })
}

// Ollama status hooks
export function useOllamaStatus() {
  return useQuery({
    queryKey: ['ollama', 'status'],
    queryFn: getOllamaStatus,
    refetchInterval: 10000, // Re-check every 10s
  })
}

export function useOllamaInstalledModels() {
  return useQuery({
    queryKey: ['ollama', 'installedModels'],
    queryFn: getOllamaInstalledModels,
  })
}

export function useOllamaCuratedModels() {
  return useQuery({
    queryKey: ['ollama', 'curatedModels'],
    queryFn: getOllamaCuratedModels,
  })
}

export function useOllamaPullModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (modelName: string) => pullOllamaModel(modelName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ollama', 'installedModels'] })
      queryClient.invalidateQueries({ queryKey: ['models', 'ollama'] })
    },
  })
}

export function useOllamaCancelPull() {
  return useMutation({
    mutationFn: cancelOllamaPull,
  })
}

export function useOllamaBaseUrl() {
  return useQuery({
    queryKey: ['ollama', 'baseUrl'],
    queryFn: getOllamaBaseUrl,
  })
}

export function useSetOllamaBaseUrl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (url: string) => setOllamaBaseUrl(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ollama'] })
    },
  })
}
