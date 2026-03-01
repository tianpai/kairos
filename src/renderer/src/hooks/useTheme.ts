import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentTheme, getTheme, setTheme } from '@api/theme'
import type { ThemeSource } from '@api/theme'

export function useTheme() {
  return useQuery({
    queryKey: ['theme'],
    queryFn: getTheme,
  })
}

export function useSetTheme() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (theme: ThemeSource) => setTheme(theme),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme'] })
    },
  })
}

export function useCurrentTheme() {
  return useQuery({
    queryKey: ['theme', 'current'],
    queryFn: getCurrentTheme,
  })
}
