import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Singleton queryClient for use outside React context (e.g., in task handlers)
export const queryClient = new QueryClient()

export function getContext() {
  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
