/**
 * The wrapper the server puts around every list. Pass it through
 * `transformPaginatedResponse` in `@irene/api/utils/transforms` before the
 * rest of the app reads it.
 */
export interface ApiPageEnvelope<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** One page of rows, as the rest of the app reads it. */
export interface ApiPage<T> {
  items: T[];
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextUrl: string | null;
  previousUrl: string | null;
}
