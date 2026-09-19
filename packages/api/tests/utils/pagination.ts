import type { ApiPageResponse } from '@irene/api/types/pagination';

/** Wraps items in the envelope DRF returns for a list endpoint. */
export const buildDrfPage = <T>(
  results: T[],
  overrides: Partial<ApiPageResponse<T>> = {}
): ApiPageResponse<T> => ({
  count: results.length,
  next: null,
  previous: null,
  results,
  ...overrides,
});
