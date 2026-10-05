import { describe, expect, it } from 'vitest';
import { API_RECORD_TYPES, isApiRecordType } from './types';

describe('isApiRecordType', () => {
  it.each(API_RECORD_TYPES)('accepts %s, which the server sends in full', (type) => {
    expect(isApiRecordType(type)).toBe(true);
  });

  it.each([
    ['a model the server only counts', 'Project'],
    ['the plural an object event uses', 'files'],
    ['a name this client does not know', 'teapot'],
    ['nothing at all', undefined],
    ['a number', 1],
    ['an object', { type: 'file' }],
  ])('rejects %s', (_label, value) => {
    expect(isApiRecordType(value)).toBe(false);
  });
});
