import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type ThemeSource = 'system' | 'light' | 'dark'

export function useTheme() {
  return useQuery({
    queryKey: ['theme'],
    queryFn: () => window.electron.theme.get(),
  })
}

export function useSetTheme() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (theme: ThemeSource) => window.electron.theme.set(theme),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme'] })
    },
  })
}

export function useCurrentTheme() {
  return useQuery({
    queryKey: ['theme', 'current'],
    queryFn: () => window.electron.theme.getCurrent(),
  })
}
