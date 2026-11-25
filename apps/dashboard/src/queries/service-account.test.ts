import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ServiceAccountEndpoints } from '@irene/api/services/service-account';
import { server } from '@tests/server';

import {
  serviceAccountKeys,
  serviceAccountOptions,
  serviceAccountProjectsOptions,
  serviceAccountsOptions,
} from './service-account';

const PAGE = { limit: 10, offset: 0, showSystemCreated: false, showCliEnabled: false };

/** Runs an options object's own fetch, as the cache would. */
const fetchWith = async <TData>(options: { queryFn?: unknown }): Promise<TData> => {
  const run = options.queryFn as () => Promise<TData>;

  return run();
};

describe('the service account keys', () => {
  it('hold every page of the list under one key, so they invalidate together', () => {
    expect(serviceAccountKeys.page(PAGE).slice(0, 2)).toStrictEqual(serviceAccountKeys.list());
  });

  it("hold an account's projects under the account itself", () => {
    expect(serviceAccountKeys.projects(9, PAGE).slice(0, 2)).toStrictEqual(
      serviceAccountKeys.detail(9)
    );
  });
});

describe('the service account queries', () => {
  it('read a page of the organization’s accounts', async () => {
    server.use(
      http.get(`*/${ServiceAccountEndpoints.list()}`, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [{ id: 9 }] })
      )
    );

    await expect(fetchWith(serviceAccountsOptions(PAGE))).resolves.toMatchObject({ count: 1 });
  });

  it('read one account', async () => {
    server.use(
      http.get(`*/${ServiceAccountEndpoints.detail(9)}`, () => HttpResponse.json({ id: 9 }))
    );

    await expect(fetchWith(serviceAccountOptions(9))).resolves.toMatchObject({ id: 9 });
  });

  it('wait for an account before reading its projects', () => {
    expect(serviceAccountOptions(undefined).enabled).toBe(false);

    expect(serviceAccountProjectsOptions(undefined, { limit: 10, offset: 0 }).enabled).toBe(false);
  });

  it('read a page of the projects one account reaches', async () => {
    server.use(
      http.get(`*/${ServiceAccountEndpoints.projects(9)}`, () =>
        HttpResponse.json({ count: 2, next: null, previous: null, results: [{ id: 4 }] })
      )
    );

    await expect(
      fetchWith(serviceAccountProjectsOptions(9, { limit: 10, offset: 0 }))
    ).resolves.toMatchObject({ count: 2 });
  });
});
