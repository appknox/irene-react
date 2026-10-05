import { faker } from '@faker-js/faker';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  API_RECORD_TYPE_FIELD,
  prependRecordToPage,
  tagPaginatedRecordsForCaching,
  tagRecordForCaching,
} from './tags';

const buildRecord = () => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  name: faker.system.fileName(),
});

describe('tagRecordForCaching', () => {
  it('tags a record with its kind', () => {
    expect(tagRecordForCaching('file', buildRecord())).toMatchObject({
      [API_RECORD_TYPE_FIELD]: 'file',
    });
  });

  it('keeps every field the record came with', () => {
    const record = buildRecord();

    expect(tagRecordForCaching('file', record)).toMatchObject(record);
  });

  it('leaves the record it was given untouched', () => {
    const record = buildRecord();

    tagRecordForCaching('file', record);

    expect(record).not.toHaveProperty(API_RECORD_TYPE_FIELD);
  });
});

describe('tagPaginatedRecordsForCaching', () => {
  const buildPage = (items: ReturnType<typeof buildRecord>[]) => ({
    items,
    count: items.length,
    hasNext: false,
    hasPrevious: false,
    nextUrl: null,
    previousUrl: null,
  });

  it('tags every row with its kind', () => {
    const page = buildPage([buildRecord(), buildRecord()]);

    const taggedPage = tagPaginatedRecordsForCaching('file', page);

    expect(taggedPage.items.map((record) => record[API_RECORD_TYPE_FIELD])).toEqual([
      'file',
      'file',
    ]);
  });

  it('keeps each row as it was', () => {
    const page = buildPage([buildRecord()]);

    expect(tagPaginatedRecordsForCaching('file', page).items[0]).toMatchObject(page.items[0]);
  });

  it('keeps everything the page said about itself', () => {
    const page = { ...buildPage([buildRecord()]), count: 40, hasNext: true };

    expect(tagPaginatedRecordsForCaching('file', page)).toMatchObject({ count: 40, hasNext: true });
  });

  it('tags nothing in an empty page', () => {
    expect(tagPaginatedRecordsForCaching('file', buildPage([])).items).toEqual([]);
  });
});

const cachedPage = (items: object[]) => ({
  items,
  count: items.length,
  hasNext: false,
  hasPrevious: false,
  nextUrl: null,
  previousUrl: null,
});

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient();
});

describe('prependRecordToPage', () => {
  it('puts a record the page does not hold at the top of it', () => {
    queryClient.setQueryData(
      ['file', 'list'],
      cachedPage([tagRecordForCaching('file', { id: 2 })])
    );

    prependRecordToPage(queryClient, ['file', 'list'], 'file', { id: 1, name: 'new' });

    expect(queryClient.getQueryData(['file', 'list'])).toMatchObject({
      items: [{ id: 1, name: 'new' }, { id: 2 }],
    });
  });

  it('tags it, so the server can update it where it now sits', () => {
    queryClient.setQueryData(['file', 'list'], cachedPage([]));

    prependRecordToPage(queryClient, ['file', 'list'], 'file', { id: 1 });

    expect(queryClient.getQueryData(['file', 'list'])).toMatchObject({
      items: [{ [API_RECORD_TYPE_FIELD]: 'file' }],
    });
  });

  it('counts the record the server created', () => {
    queryClient.setQueryData(
      ['file', 'list'],
      cachedPage([tagRecordForCaching('file', { id: 2 })])
    );

    prependRecordToPage(queryClient, ['file', 'list'], 'file', { id: 1 });

    expect(queryClient.getQueryData(['file', 'list'])).toMatchObject({ count: 2 });
  });

  it('leaves a record the page already holds alone, which is an update', () => {
    queryClient.setQueryData(
      ['file', 'list'],
      cachedPage([tagRecordForCaching('file', { id: 1, name: 'before' })])
    );

    prependRecordToPage(queryClient, ['file', 'list'], 'file', { id: 1, name: 'after' });

    expect(queryClient.getQueryData(['file', 'list'])).toMatchObject({
      count: 1,
      items: [{ id: 1, name: 'before' }],
    });
  });

  it('writes nothing to a page nothing has read', () => {
    prependRecordToPage(queryClient, ['file', 'list'], 'file', { id: 1 });

    expect(queryClient.getQueryData(['file', 'list'])).toBeUndefined();
  });
});
