import { QueryClient } from '@tanstack/react-query'
import { getErrorStatus } from '../api/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't retry client errors (403, 404, 422…); they won't fix themselves.
      retry: (failureCount, error) => {
        const status = getErrorStatus(error)
        if (status !== undefined && status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
  },
})
