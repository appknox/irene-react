import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { ApiPage } from '@irene/api/utils/pagination';

import type { ApiRecordType } from './types';

/*
  The type a record carries, so the cache can tell one record from another.

  An id alone cannot say which record it is, because ids repeat between types:
  file 1 and analysis 1 are different records. So a record is tagged with its
  type on the way in, and the cache keys it by the type and the id together.

  A record the server has just created is tagged on its way into a page too,
  because the normalized cache can update a record wherever it is held but
  cannot put one into a list that has never held it.
*/

/**
 * The field holding a record's type.
 *
 * This client adds it and the server never sends it, so a request body built
 * from a cached record has to drop it.
 */
export const API_RECORD_TYPE_FIELD = '__record';

/** A record carrying its type. */
export type ApiTaggedRecord<TRecord> = TRecord & { [API_RECORD_TYPE_FIELD]: ApiRecordType };

/**
 * Tags a record with its type, so the cache can key it.
 *
 * An untagged record has no key, so an update the server sends for it is lost.
 *
 * @param type - The record's type, as the server names it.
 * @param record - The record the endpoint returned.
 * @returns The record carrying its type.
 */
export function tagRecordForCaching<TRecord extends object>(
  type: ApiRecordType,
  record: TRecord
): ApiTaggedRecord<TRecord> {
  return { ...record, [API_RECORD_TYPE_FIELD]: type };
}

/**
 * Tags every row of a page, so a list's rows are cached too.
 *
 * @param type - The type the rows are.
 * @param page - The page the service read.
 * @returns The same page, with every row tagged.
 */
export function tagPaginatedRecordsForCaching<TRecord extends object>(
  type: ApiRecordType,
  page: ApiPage<TRecord>
): ApiPage<ApiTaggedRecord<TRecord>> {
  return { ...page, items: page.items.map((record) => tagRecordForCaching(type, record)) };
}

/**
 * Puts a record the server just created at the top of a cached page.
 *
 * A created record is in no query yet, and the list it belongs to may be
 * filtered in a way that excludes it — a new upload is not yet "validating" —
 * so it is put in rather than fetched for. It is tagged on the way, which is
 * what lets the server update it there afterwards.
 *
 * A record the page already holds is left alone: that is an update, and the
 * normalized cache has already applied it.
 *
 * @param queryClient - The cache the page lives in.
 * @param queryKey - The page to put it at the top of.
 * @param type - The record's type.
 * @param record - The record as the server sent it.
 */
export function prependRecordToPage<TRecord extends { id: string | number }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  type: ApiRecordType,
  record: TRecord
) {
  queryClient.setQueryData<ApiPage<ApiTaggedRecord<TRecord>>>(queryKey, (page) => {
    if (!page || page.items.some((item) => item.id === record.id)) {
      return page;
    }

    return {
      ...page,
      items: [tagRecordForCaching(type, record), ...page.items],
      count: page.count + 1,
    };
  });
}

/**
 * The page with one row changed, for writing back into the cache.
 *
 * A page the cache has not read is returned as it is, because answering with
 * anything else would put a page there that no request ever made. A row the
 * page does not hold leaves it unchanged for the same reason.
 *
 * @param page - The page as the cache holds it, if it holds one.
 * @param id - The row to change.
 * @param changes - What to change about it.
 * @returns The page to write back.
 */
export function patchPaginationItem<TItem extends { id: number | string }>(
  page: ApiPage<TItem> | undefined,
  id: TItem['id'],
  changes: Partial<TItem>
) {
  if (!page) {
    return page;
  }

  return {
    ...page,
    items: page.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
  };
}
