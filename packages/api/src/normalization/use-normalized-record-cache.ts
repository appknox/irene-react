import { useQueryNormalizer } from '@normy/react-query';
import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getRecordCacheKey } from './cache-keys';
import { tagRecordForCaching } from './tags';
import type { ApiRecordType, ApiRecordWithId } from './types';

/** The two things a record cache needs of the normalizer. */
interface ApiRecordNormalizer {
  setNormalizedData: (record: ApiRecordWithId) => void;
  getDependentQueriesByIds: (keys: readonly string[]) => QueryKey[];
}

/**
 * Writes a record into the cache, and finds the queries already holding one.
 *
 * The normalizer keys every cached record by type and id, which answers both
 * questions: where a record goes, and which queries hold it. Callers that have
 * a record from outside a request — a socket, a push, a mutation reply — write
 * it through here rather than naming the queries it might be in.
 *
 * @param queryClient - The cache the queries live in.
 * @param normalizer - The normalized view of it.
 * @returns A record cache to write through.
 */
function _createNormalizedRecordCache(queryClient: QueryClient, normalizer: ApiRecordNormalizer) {
  return {
    write(type: ApiRecordType, record: ApiRecordWithId) {
      /* Tagged on the way in, because a record from outside a request carries no type. */
      normalizer.setNormalizedData(tagRecordForCaching(type, record));
    },

    readQueriesHolding(type: ApiRecordType, id: string | number) {
      normalizer
        .getDependentQueriesByIds([getRecordCacheKey(type, id)])
        .forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }));
    },
  };
}

/**
 * The record cache for the app's own query client.
 *
 * @returns A record cache to write through.
 */
export function useNormalizedRecordCache() {
  const queryClient = useQueryClient();
  const normalizer = useQueryNormalizer();

  return useMemo(
    () => _createNormalizedRecordCache(queryClient, normalizer),
    [normalizer, queryClient]
  );
}
