import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

/** Wraps items in the envelope DRF returns for a list endpoint. */
export const buildDrfPage = <T>(
  results: T[],
  overrides: Partial<ApiPageEnvelope<T>> = {}
): ApiPageEnvelope<T> => ({
  count: results.length,
  next: null,
  previous: null,
  results,
  ...overrides,
});
