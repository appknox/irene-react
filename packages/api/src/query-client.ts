import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

const RETRYABLE_ATTEMPTS = 2;

/**
 * Retry transient failures only. A 4xx fails again with the same request, and
 * retrying a 429 makes the rate limit worse.
 */
const _shouldRetry = (failureCount: number, error: unknown) => {
  if (failureCount >= RETRYABLE_ATTEMPTS) {
    return false;
  }

  const status = isAxiosError(error) ? error.status : undefined;

  return status === undefined || status >= 500;
};

/** 
 * App wide query client with the default options. To be used in all apps such as dashboard.
 
 * - Stale time: 30 seconds
 * - GC time: 5 minutes
 * - Retry: true if the error is an Axios error and the status is >= 500
 * - Refetch on window focus: false
 * - Mutations: false
 
 * @returns A query client with the default options
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: _shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
