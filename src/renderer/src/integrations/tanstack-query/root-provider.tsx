import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Singleton queryClient for use outside React context (e.g., in task handlers)
export const queryClient = new QueryClient()

export function getContext() {
  return {
    client: queryClient,
  }
}

export function Provider({
  children,
  client,
}: {
  children: React.ReactNode
  client: QueryClient
}) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
