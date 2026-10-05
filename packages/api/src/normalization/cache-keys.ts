import { API_RECORD_TYPE_FIELD } from './tags';
import { isApiRecordType, type ApiRecordType } from './types';

/*
  The key the cache holds a record under, and the configuration that applies it.

  Every holder of a key has to agree on its format, so the one that builds a key
  from a record and the one that builds it from a type and an id live together.
*/

/**
 * The key a record is held under.
 *
 * @param type - The record's type.
 * @param id - The record's id.
 * @returns The key.
 */
export function getRecordCacheKey(type: ApiRecordType, id: string | number) {
  return `${type}:${id}`;
}

/**
 * The key for a value the cache is holding, read off the value itself.
 *
 * Returning nothing leaves the value alone, which is what anything untagged
 * gets: a page envelope, a configuration, a count.
 *
 * @param value - Whatever the cache is holding.
 * @returns The key, or nothing when the value is untagged.
 */
function _getCacheKeyForRecord(value: unknown) {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  if (!(API_RECORD_TYPE_FIELD in value) || !('id' in value)) {
    return undefined;
  }

  const { [API_RECORD_TYPE_FIELD]: type, id } = value;

  if (!isApiRecordType(type) || (typeof id !== 'string' && typeof id !== 'number')) {
    return undefined;
  }

  return getRecordCacheKey(type, id);
}

/** What an app passes its normalizer, so two queries share one record. */
export const NORMALIZER_CONFIG = { getNormalizationObjectKey: _getCacheKeyForRecord };
