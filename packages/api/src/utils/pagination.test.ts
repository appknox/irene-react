import { describe, expect, it } from 'vitest';
import { transformPaginatedResponse, type ApiPageEnvelope } from '@irene/api/utils/pagination';

/** A list response as the server sends it. */
const respondWith = (overrides = {}) => ({
  count: 2,
  next: 'https://api.example.test/api/v3/projects?limit=1&offset=1',
  previous: null,
  results: [{ id: 1 }, { id: 2 }],
  ...overrides,
});

describe('transformPaginatedResponse', () => {
  it('renames the rows to something a caller would guess', () => {
    expect(transformPaginatedResponse(respondWith()).items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('keeps the total, which counts every row rather than this page', () => {
    expect(transformPaginatedResponse(respondWith({ count: 97 })).count).toBe(97);
  });

  it('says there is more either side, without a caller reading a URL', () => {
    const page = transformPaginatedResponse(respondWith());

    expect(page.hasNext).toBe(true);
    expect(page.hasPrevious).toBe(false);
  });

  it('keeps the page links, so a cursor endpoint is not locked out later', () => {
    const response = respondWith({ previous: 'https://api.example.test/prev' });
    const page = transformPaginatedResponse(response);

    expect(page.nextUrl).toBe(response.next);
    expect(page.previousUrl).toBe(response.previous);
  });

  it('reads a last page as having nothing after it', () => {
    const page = transformPaginatedResponse(respondWith({ next: null }));

    expect(page.hasNext).toBe(false);
    expect(page.nextUrl).toBeNull();
  });

  it('survives a body missing the rows entirely', () => {
    // The server has answered a list with no `results` key, which the types do not admit.
    const bodyWithoutRows: ApiPageEnvelope<{ id: number }> = {
      count: 0,
      next: null,
      previous: null,
      ...({} as { results: { id: number }[] }),
    };

    const page = transformPaginatedResponse(bodyWithoutRows);

    expect(page.items).toEqual([]);
    expect(page.count).toBe(0);
  });
});
