import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type ProviderType = 'openai' | 'deepseek'

// API Key hooks
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
    mutationFn: ({ provider, model }: { provider: ProviderType; model: string }) =>
      window.electron.models.setSelected(provider, model),
    onSuccess: (_, { provider }) => {
      queryClient.invalidateQueries({ queryKey: ['models', 'selected', provider] })
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
    mutationFn: (provider: ProviderType) => window.electron.provider.setActive(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider'] })
    },
  })
}
