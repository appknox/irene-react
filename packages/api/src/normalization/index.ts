/*
  How the query cache identifies a record, and what follows from it.

  `types` says what a record is and which types the server sends, `tags` puts
  a type on a record — on its own, on a page of them, or on one being put into
  a page already read — and `cache-keys` turns that into the key the cache
  holds it under. The hook writes a record wherever the cache holds it.

  An app wraps its own `QueryNormalizerProvider` with `NORMALIZER_CONFIG`, so
  the provider stays where the rest of the provider tree is.
*/

export * from './types';
export * from './tags';

export { getRecordCacheKey, NORMALIZER_CONFIG } from './cache-keys';
export { useNormalizedRecordCache } from './use-normalized-record-cache';
