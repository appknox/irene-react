import type { DrfPageResponse } from '@irene/api/types/pagination';

/** Wraps items in the envelope DRF returns for a list endpoint. */
export const buildDrfPage = <T>(
  results: T[],
  overrides: Partial<DrfPageResponse<T>> = {}
): DrfPageResponse<T> => ({
  count: results.length,
  next: null,
  previous: null,
  results,
  ...overrides,
});
