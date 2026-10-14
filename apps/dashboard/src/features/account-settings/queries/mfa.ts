import { queryOptions } from '@tanstack/react-query';
import { MfaService } from '@irene/api/services/mfa';

/** The cache keys for the signed-in account's second factor. */
export const mfaKeys = {
  all: () => ['mfa'] as const,
  methods: () => [...mfaKeys.all(), 'methods'] as const,
};

/**
 * Builds the query for both second-factor methods and which one is active.
 *
 * @returns Query options resolving to the methods, the authenticator app first.
 */
export const mfaMethodsOptions = () =>
  queryOptions({
    queryKey: mfaKeys.methods(),
    queryFn: MfaService.getMfaMethods,
  });
