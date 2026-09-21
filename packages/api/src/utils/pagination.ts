/**
 * The wrapper the server puts around every list. Pass it through
 * `transformPaginatedResponse` in `@irene/api/utils/pagination` before the
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

/**
 * Turns the server's list wrapper into the page shape the app reads. Every list
 * endpoint answers the same wrapper, so no service should be interpreting it for
 * itself.
 *
 * @param response - The list response exactly as the server sent it.
 * @returns The rows, the total, whether there is more either side, and the server's own page links.
 */
export const transformPaginatedResponse = <T>(response: ApiPageEnvelope<T>): ApiPage<T> => ({
  items: response.results ?? [],
  count: response.count ?? 0,
  hasNext: Boolean(response.next),
  hasPrevious: Boolean(response.previous),
  nextUrl: response.next ?? null,
  previousUrl: response.previous ?? null,
});
