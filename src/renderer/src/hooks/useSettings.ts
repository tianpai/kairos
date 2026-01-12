import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ProviderType } from '../../../shared/providers'

// OpenAI API Key hooks
export function useHasApiKey() {
  return useQuery({
    queryKey: ['settings', 'hasApiKey'],
    queryFn: () => window.electron.settings.hasApiKey(),
  })
}

export function useApiKey() {
  return useQuery({
    queryKey: ['settings', 'apiKey'],
    queryFn: () => window.electron.settings.getApiKey(),
  })
}

export function useSetApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => window.electron.settings.setApiKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.electron.settings.deleteApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// DeepSeek API Key hooks
export function useHasDeepSeekApiKey() {
  return useQuery({
    queryKey: ['settings', 'hasDeepSeekApiKey'],
    queryFn: () => window.electron.settings.hasDeepSeekApiKey(),
  })
}

export function useDeepSeekApiKey() {
  return useQuery({
    queryKey: ['settings', 'deepSeekApiKey'],
    queryFn: () => window.electron.settings.getDeepSeekApiKey(),
  })
}

export function useSetDeepSeekApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) =>
      window.electron.settings.setDeepSeekApiKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteDeepSeekApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.electron.settings.deleteDeepSeekApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// xAI API Key hooks
export function useHasXAIApiKey() {
  return useQuery({
    queryKey: ['settings', 'hasXAIApiKey'],
    queryFn: () => window.electron.settings.hasXAIApiKey(),
  })
}

export function useXAIApiKey() {
  return useQuery({
    queryKey: ['settings', 'xaiApiKey'],
    queryFn: () => window.electron.settings.getXAIApiKey(),
  })
}

export function useSetXAIApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => window.electron.settings.setXAIApiKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteXAIApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.electron.settings.deleteXAIApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// Gemini API Key hooks
export function useHasGeminiApiKey() {
  return useQuery({
    queryKey: ['settings', 'hasGeminiApiKey'],
    queryFn: () => window.electron.settings.hasGeminiApiKey(),
  })
}

export function useGeminiApiKey() {
  return useQuery({
    queryKey: ['settings', 'geminiApiKey'],
    queryFn: () => window.electron.settings.getGeminiApiKey(),
  })
}

export function useSetGeminiApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => window.electron.settings.setGeminiApiKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteGeminiApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.electron.settings.deleteGeminiApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// Anthropic API Key hooks
export function useHasAnthropicApiKey() {
  return useQuery({
    queryKey: ['settings', 'hasAnthropicApiKey'],
    queryFn: () => window.electron.settings.hasAnthropicApiKey(),
  })
}

export function useAnthropicApiKey() {
  return useQuery({
    queryKey: ['settings', 'anthropicApiKey'],
    queryFn: () => window.electron.settings.getAnthropicApiKey(),
  })
}

export function useSetAnthropicApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) =>
      window.electron.settings.setAnthropicApiKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeleteAnthropicApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.electron.settings.deleteAnthropicApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// Model hooks
export function useFetchModels(provider: ProviderType) {
  return useQuery({
    queryKey: ['models', provider],
    queryFn: () => window.electron.models.fetch(provider),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSelectedModel(provider: ProviderType) {
  return useQuery({
    queryKey: ['models', 'selected', provider],
    queryFn: () => window.electron.models.getSelected(provider),
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
    }) => window.electron.models.setSelected(provider, model),
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
    queryFn: () => window.electron.models.getDefault(provider),
  })
}

// Provider hooks
export function useActiveProvider() {
  return useQuery({
    queryKey: ['provider', 'active'],
    queryFn: () => window.electron.provider.getActive(),
  })
}

export function useSetActiveProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (provider: ProviderType) =>
      window.electron.provider.setActive(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'hasApiKey'] })
    },
  })
}

// Claude OAuth hooks
export function useClaudeIsAuthenticated() {
  return useQuery({
    queryKey: ['claude', 'isAuthenticated'],
    queryFn: () => window.electron.claudeSubscription.isAuthenticated(),
  })
}

export function useClaudeStartAuth() {
  return useMutation({
    mutationFn: () => window.electron.claudeSubscription.startAuthorization(),
  })
}

export function useClaudeCompleteAuth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      code,
      codeVerifier,
    }: {
      code: string
      codeVerifier?: string
    }) =>
      window.electron.claudeSubscription.completeAuthorization(
        code,
        codeVerifier,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claude'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useClaudeLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => window.electron.claudeSubscription.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claude'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// Claude auth mode hooks
export function useClaudeAuthMode() {
  return useQuery({
    queryKey: ['claude', 'authMode'],
    queryFn: () => window.electron.claudeSubscription.getAuthMode(),
  })
}

export function useSetClaudeAuthMode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mode: 'oauth' | 'cli') =>
      window.electron.claudeSubscription.setAuthMode(mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claude'] })
    },
  })
}

// Claude CLI status hooks
export function useClaudeCliStatus() {
  return useQuery({
    queryKey: ['claude', 'cli', 'status'],
    queryFn: async () => {
      const [installed, authenticated, version, path] = await Promise.all([
        window.electron.claudeSubscription.isCliInstalled(),
        window.electron.claudeSubscription.isCliAuthenticated(),
        window.electron.claudeSubscription.getCliVersion(),
        window.electron.claudeSubscription.getCliPath(),
      ])
      return { installed, authenticated, version, path }
    },
  })
}

// Claude CLI path hooks
export function useClaudeCliPath() {
  return useQuery({
    queryKey: ['claude', 'cli', 'path'],
    queryFn: () => window.electron.claudeSubscription.getCliPath(),
  })
}

export function useClaudeConfiguredCliPath() {
  return useQuery({
    queryKey: ['claude', 'cli', 'configuredPath'],
    queryFn: async () => {
      const path =
        await window.electron.claudeSubscription.getConfiguredCliPath()
      return path ?? null // Ensure we return null, not undefined
    },
  })
}

export function useSetClaudeCliPath() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (path: string | null) =>
      window.electron.claudeSubscription.setCliPath(path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claude', 'cli'] })
    },
  })
}

// Ollama status hooks
export function useOllamaStatus() {
  return useQuery({
    queryKey: ['ollama', 'status'],
    queryFn: async () => {
      const [running, version] = await Promise.all([
        window.electron.ollama.isRunning(),
        window.electron.ollama.getVersion(),
      ])
      return { running, version }
    },
    refetchInterval: 10000, // Re-check every 10s
  })
}

export function useOllamaInstalledModels() {
  return useQuery({
    queryKey: ['ollama', 'installedModels'],
    queryFn: () => window.electron.ollama.getInstalledModels(),
  })
}

export function useOllamaCuratedModels() {
  return useQuery({
    queryKey: ['ollama', 'curatedModels'],
    queryFn: () => window.electron.ollama.getCuratedModels(),
  })
}

export function useOllamaPullModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (modelName: string) =>
      window.electron.ollama.pullModel(modelName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ollama', 'installedModels'] })
      queryClient.invalidateQueries({ queryKey: ['models', 'ollama'] })
    },
  })
}

export function useOllamaCancelPull() {
  return useMutation({
    mutationFn: () => window.electron.ollama.cancelPull(),
  })
}

export function useOllamaBaseUrl() {
  return useQuery({
    queryKey: ['ollama', 'baseUrl'],
    queryFn: () => window.electron.ollama.getBaseUrl(),
  })
}

export function useSetOllamaBaseUrl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (url: string) => window.electron.ollama.setBaseUrl(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ollama'] })
    },
  })
}
