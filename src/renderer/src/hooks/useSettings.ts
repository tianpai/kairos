import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ProviderType } from '../../../shared/providers'

// OpenAI API Key hooks
export function useHasApiKey() {
  return useQuery({
    queryKey: ['settings', 'hasApiKey'],
    queryFn: () => window.kairos.settings.hasApiKey(),
  })
}

export function useApiKey() {
  return useQuery({
    queryKey: ['settings', 'apiKey'],
    queryFn: () => window.kairos.settings.getApiKey(),
  })
}

export function useSetApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => window.kairos.settings.setApiKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.kairos.settings.deleteApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// DeepSeek API Key hooks
export function useHasDeepSeekApiKey() {
  return useQuery({
    queryKey: ['settings', 'hasDeepSeekApiKey'],
    queryFn: () => window.kairos.settings.hasDeepSeekApiKey(),
  })
}

export function useDeepSeekApiKey() {
  return useQuery({
    queryKey: ['settings', 'deepSeekApiKey'],
    queryFn: () => window.kairos.settings.getDeepSeekApiKey(),
  })
}

export function useSetDeepSeekApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) =>
      window.kairos.settings.setDeepSeekApiKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteDeepSeekApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.kairos.settings.deleteDeepSeekApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// xAI API Key hooks
export function useHasXAIApiKey() {
  return useQuery({
    queryKey: ['settings', 'hasXAIApiKey'],
    queryFn: () => window.kairos.settings.hasXAIApiKey(),
  })
}

export function useXAIApiKey() {
  return useQuery({
    queryKey: ['settings', 'xaiApiKey'],
    queryFn: () => window.kairos.settings.getXAIApiKey(),
  })
}

export function useSetXAIApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => window.kairos.settings.setXAIApiKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteXAIApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.kairos.settings.deleteXAIApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// Gemini API Key hooks
export function useHasGeminiApiKey() {
  return useQuery({
    queryKey: ['settings', 'hasGeminiApiKey'],
    queryFn: () => window.kairos.settings.hasGeminiApiKey(),
  })
}

export function useGeminiApiKey() {
  return useQuery({
    queryKey: ['settings', 'geminiApiKey'],
    queryFn: () => window.kairos.settings.getGeminiApiKey(),
  })
}

export function useSetGeminiApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => window.kairos.settings.setGeminiApiKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteGeminiApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.kairos.settings.deleteGeminiApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// Anthropic API Key hooks
export function useHasAnthropicApiKey() {
  return useQuery({
    queryKey: ['settings', 'hasAnthropicApiKey'],
    queryFn: () => window.kairos.settings.hasAnthropicApiKey(),
  })
}

export function useAnthropicApiKey() {
  return useQuery({
    queryKey: ['settings', 'anthropicApiKey'],
    queryFn: () => window.kairos.settings.getAnthropicApiKey(),
  })
}

export function useSetAnthropicApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) =>
      window.kairos.settings.setAnthropicApiKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteAnthropicApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.kairos.settings.deleteAnthropicApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// Model hooks
export function useFetchModels(provider: ProviderType) {
  return useQuery({
    queryKey: ['models', provider],
    queryFn: () => window.kairos.models.fetch(provider),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSelectedModel(provider: ProviderType) {
  return useQuery({
    queryKey: ['models', 'selected', provider],
    queryFn: () => window.kairos.models.getSelected(provider),
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
    }) => window.kairos.models.setSelected(provider, model),
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
    queryFn: () => window.kairos.models.getDefault(provider),
  })
}

// Provider hooks
export function useActiveProvider() {
  return useQuery({
    queryKey: ['provider', 'active'],
    queryFn: () => window.kairos.provider.getActive(),
  })
}

export function useSetActiveProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (provider: ProviderType) =>
      window.kairos.provider.setActive(provider),
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
    queryFn: async () => {
      const [running, version] = await Promise.all([
        window.kairos.ollama.isRunning(),
        window.kairos.ollama.getVersion(),
      ])
      return { running, version }
    },
    refetchInterval: 10000, // Re-check every 10s
  })
}

export function useOllamaInstalledModels() {
  return useQuery({
    queryKey: ['ollama', 'installedModels'],
    queryFn: () => window.kairos.ollama.getInstalledModels(),
  })
}

export function useOllamaCuratedModels() {
  return useQuery({
    queryKey: ['ollama', 'curatedModels'],
    queryFn: () => window.kairos.ollama.getCuratedModels(),
  })
}

export function useOllamaPullModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (modelName: string) =>
      window.kairos.ollama.pullModel(modelName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ollama', 'installedModels'] })
      queryClient.invalidateQueries({ queryKey: ['models', 'ollama'] })
    },
  })
}

export function useOllamaCancelPull() {
  return useMutation({
    mutationFn: () => window.kairos.ollama.cancelPull(),
  })
}

export function useOllamaBaseUrl() {
  return useQuery({
    queryKey: ['ollama', 'baseUrl'],
    queryFn: () => window.kairos.ollama.getBaseUrl(),
  })
}

export function useSetOllamaBaseUrl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (url: string) => window.kairos.ollama.setBaseUrl(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ollama'] })
    },
  })
}
