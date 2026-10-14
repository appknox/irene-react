import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { getRecordCacheKey, NORMALIZER_CONFIG } from './cache-keys';
import { API_RECORD_TYPE_FIELD, tagRecordForCaching } from './tags';
import { API_RECORD_TYPES } from './types';

const buildRecord = () => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  name: faker.system.fileName(),
});

const getCacheKey = NORMALIZER_CONFIG.getNormalizationObjectKey;

describe('NORMALIZER_CONFIG.getNormalizationObjectKey', () => {
  it.each(API_RECORD_TYPES)('keys a tagged %s record by its type and id', (type) => {
    const record = buildRecord();

    expect(getCacheKey(tagRecordForCaching(type, record))).toBe(getRecordCacheKey(type, record.id));
  });

  it('keys a record whose id is text, which some endpoints return', () => {
    const id = faker.string.uuid();

    expect(getCacheKey(tagRecordForCaching('file', { id }))).toBe(getRecordCacheKey('file', id));
  });

  it('keys nothing for an untagged object, which is everything else the cache holds', () => {
    expect(getCacheKey({ id: 1, count: 40 })).toBeUndefined();
  });

  it('keys nothing for an object tagged with a type this client does not know', () => {
    expect(getCacheKey({ [API_RECORD_TYPE_FIELD]: 'teapot', id: 1 })).toBeUndefined();
  });

  it('keys nothing for a tagged value with no id to key it by', () => {
    expect(getCacheKey(tagRecordForCaching('file', { name: 'a.apk' }))).toBeUndefined();
  });

  it.each([
    ['an object', { id: {} }],
    ['null', null],
  ])('keys nothing for a record whose id is %s', (_label, id) => {
    expect(getCacheKey(tagRecordForCaching('file', { id }))).toBeUndefined();
  });

  it.each([
    ['nothing at all', undefined],
    ['null', null],
    ['text', 'file'],
    ['a number', 1],
    ['an array, which the cache walks into', ['file']],
  ])('keys nothing for %s', (_label, value) => {
    expect(getCacheKey(value)).toBeUndefined();
  });
});
