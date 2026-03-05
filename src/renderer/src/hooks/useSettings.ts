import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteProviderApiKey,
  fetchModels,
  getActiveProvider,
  getDefaultModel,
  getProviderApiKey,
  getSelectedModel,
  hasActiveProviderApiKey,
  hasProviderApiKey,
  setActiveProvider,
  setProviderApiKey,
  setSelectedModel,
} from '@api/settings'
import type { ProviderType } from '../../../shared/providers'

export function useHasProviderApiKey(provider: ProviderType) {
  return useQuery({
    queryKey: ['apiKey', 'has', provider],
    queryFn: () => hasProviderApiKey(provider),
  })
}

export function useProviderApiKey(provider: ProviderType) {
  return useQuery({
    queryKey: ['apiKey', 'value', provider],
    queryFn: () => getProviderApiKey(provider),
  })
}

export function useSetProviderApiKey(provider: ProviderType) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => setProviderApiKey(provider, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKey'] })
      queryClient.invalidateQueries({
        queryKey: ['provider', 'models', provider],
      })
    },
  })
}

export function useDeleteProviderApiKey(provider: ProviderType) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteProviderApiKey(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKey'] })
      queryClient.invalidateQueries({
        queryKey: ['provider', 'models', provider],
      })
    },
  })
}

export function useHasActiveProviderApiKey() {
  return useQuery({
    queryKey: ['apiKey', 'has', 'active'],
    queryFn: hasActiveProviderApiKey,
  })
}

// Model hooks
export function useFetchModels(provider: ProviderType) {
  return useQuery({
    queryKey: ['provider', 'models', provider],
    queryFn: () => fetchModels(provider),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSelectedModel(provider: ProviderType) {
  return useQuery({
    queryKey: ['provider', 'selectedModel', provider],
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
        queryKey: ['provider', 'selectedModel', provider],
      })
    },
  })
}

export function useDefaultModel(provider: ProviderType) {
  return useQuery({
    queryKey: ['provider', 'defaultModel', provider],
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
      queryClient.invalidateQueries({ queryKey: ['provider', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['apiKey', 'has', 'active'] })
    },
  })
}
