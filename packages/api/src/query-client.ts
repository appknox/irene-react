import { QueryClient } from '@tanstack/react-query';

import { HTTP_STATUS_CODES } from '@irene/constants';
import { getApiErrorStatus, isAbortedRequest } from '@irene/api/utils/errors';

const RETRYABLE_ATTEMPTS = 2;

/**
 * Retry transient failures only. A 4xx fails again with the same request, and
 * retrying a 429 makes the rate limit worse.
 *
 * An abandoned request is not retried either: it carries no status, so it would
 * otherwise read as a network failure, and each attempt would wait out the same
 * timeout before giving up again.
 */
const _shouldRetry = (failureCount: number, error: unknown) => {
  if (failureCount >= RETRYABLE_ATTEMPTS || isAbortedRequest(error)) {
    return false;
  }

  const status = getApiErrorStatus(error);

  return status === undefined || status >= HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
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
