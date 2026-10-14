import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { NORMALIZER_CONFIG } from './cache-keys';
import { tagRecordForCaching } from './tags';
import { useNormalizedRecordCache } from './use-normalized-record-cache';

const cachedPage = (items: object[]) => ({
  items,
  count: items.length,
  hasNext: false,
  hasPrevious: false,
  nextUrl: null,
  previousUrl: null,
});

const cachedFile = (id: number, name: string) => tagRecordForCaching('file', { id, name });

let queryClient: QueryClient;
let cache: ReturnType<typeof useNormalizedRecordCache>;
let unmountCache: () => void;

const withNormalization = ({ children }: { children: ReactNode }) => (
  <QueryNormalizerProvider queryClient={queryClient} normalizerConfig={NORMALIZER_CONFIG}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </QueryNormalizerProvider>
);

beforeEach(() => {
  queryClient = new QueryClient();

  /* Rendered before each test writes, because the provider subscribes on mount. */
  const { result, unmount } = renderHook(() => useNormalizedRecordCache(), {
    wrapper: withNormalization,
  });

  cache = result.current;
  unmountCache = unmount;
});

afterEach(() => {
  unmountCache();
});

describe('writing a record', () => {
  it('reaches a cached page already holding it', () => {
    queryClient.setQueryData(['file', 'list'], cachedPage([cachedFile(1, 'before')]));

    cache.write('file', { id: 1, name: 'after' });

    expect(queryClient.getQueryData(['file', 'list'])).toMatchObject({
      items: [{ id: 1, name: 'after' }],
    });
  });

  it('leaves the rest of the page as it was', () => {
    queryClient.setQueryData(
      ['file', 'list'],
      cachedPage([cachedFile(1, 'before'), cachedFile(2, 'untouched')])
    );

    cache.write('file', { id: 1, name: 'after' });

    expect(queryClient.getQueryData(['file', 'list'])).toMatchObject({
      count: 2,
      items: [
        { id: 1, name: 'after' },
        { id: 2, name: 'untouched' },
      ],
    });
  });

  it('keeps fields the server left out', () => {
    queryClient.setQueryData(['file', 'list'], cachedPage([cachedFile(1, 'before')]));

    cache.write('file', { id: 1 });

    expect(queryClient.getQueryData(['file', 'list'])).toMatchObject({
      items: [{ id: 1, name: 'before' }],
    });
  });

  it('reaches every cached page holding it, not only the first', () => {
    queryClient.setQueryData(['file', 'list', 'open'], cachedPage([cachedFile(1, 'before')]));
    queryClient.setQueryData(['file', 'list', 'all'], cachedPage([cachedFile(1, 'before')]));

    cache.write('file', { id: 1, name: 'after' });

    expect(queryClient.getQueryData(['file', 'list', 'open'])).toMatchObject({
      items: [{ id: 1, name: 'after' }],
    });

    expect(queryClient.getQueryData(['file', 'list', 'all'])).toMatchObject({
      items: [{ id: 1, name: 'after' }],
    });
  });

  it('reaches a query nothing declared, since the record is what is matched', () => {
    queryClient.setQueryData(
      ['submission', 'list'],
      cachedPage([tagRecordForCaching('submission', { id: 7, file: cachedFile(1, 'before') })])
    );

    cache.write('file', { id: 1, name: 'after' });

    expect(queryClient.getQueryData(['submission', 'list'])).toMatchObject({
      items: [{ id: 7, file: { id: 1, name: 'after' } }],
    });
  });

  it('leaves another kind of record holding the same id alone', () => {
    queryClient.setQueryData(['file', 'list'], cachedPage([cachedFile(1, 'before')]));

    queryClient.setQueryData(
      ['analysis', 'list'],
      cachedPage([tagRecordForCaching('analysis', { id: 1, name: 'untouched' })])
    );

    cache.write('file', { id: 1, name: 'after' });

    expect(queryClient.getQueryData(['analysis', 'list'])).toMatchObject({
      items: [{ id: 1, name: 'untouched' }],
    });
  });

  it('changes nothing when no query holds the record', () => {
    queryClient.setQueryData(['file', 'list'], cachedPage([cachedFile(2, 'another')]));

    cache.write('file', { id: 1, name: 'after' });

    expect(queryClient.getQueryData(['file', 'list'])).toMatchObject({
      items: [{ id: 2, name: 'another' }],
    });
  });
});

describe('reading the queries holding a record', () => {
  it('reads the query that holds it', () => {
    queryClient.setQueryData(['file', 'list'], cachedPage([cachedFile(1, 'before')]));

    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    cache.readQueriesHolding('file', 1);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['file', 'list'] });
  });

  it('reads every query that holds it', () => {
    queryClient.setQueryData(['file', 'list', 'open'], cachedPage([cachedFile(1, 'before')]));
    queryClient.setQueryData(['file', 'list', 'all'], cachedPage([cachedFile(1, 'before')]));

    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    cache.readQueriesHolding('file', 1);

    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it('reads nothing when no query holds it', () => {
    queryClient.setQueryData(['file', 'list'], cachedPage([cachedFile(2, 'another')]));

    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    cache.readQueriesHolding('file', 1);

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('reads nothing for another kind of record with the same id', () => {
    queryClient.setQueryData(
      ['analysis', 'list'],
      cachedPage([tagRecordForCaching('analysis', { id: 1, name: 'an analysis' })])
    );

    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    cache.readQueriesHolding('file', 1);

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('the cache a component is given', () => {
  it('is the same cache across renders, so an effect holding it does not restart', () => {
    const { result, rerender, unmount } = renderHook(() => useNormalizedRecordCache(), {
      wrapper: withNormalization,
    });

    const first = result.current;

    rerender();

    expect(result.current).toBe(first);

    unmount();
  });

  it('cannot be read without the provider above it', () => {
    expect(() =>
      renderHook(() => useNormalizedRecordCache(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })
    ).toThrow();
  });
});
