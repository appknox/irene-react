import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { queryClient } from '@irene/api';

/** A failure shaped the way the client actually rejects. */
const failedWith = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_RESPONSE', {} as InternalAxiosRequestConfig, undefined, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  });

const retry = () =>
  queryClient.getDefaultOptions().queries?.retry as (count: number, error: unknown) => boolean;

describe('query defaults', () => {
  it('does not refetch on window focus', () => {
    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });

  it('never retries mutations', () => {
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(false);
  });
});

describe('retry policy', () => {
  it.each([401, 403, 404, 429])('does not retry a %s', (status) => {
    expect(retry()(0, failedWith(status))).toBe(false);
  });

  it('retries a server error', () => {
    expect(retry()(0, failedWith(500))).toBe(true);
  });

  it('retries a network error with no response', () => {
    expect(retry()(0, new AxiosError('offline', 'ERR_NETWORK'))).toBe(true);
  });

  it('gives up after two attempts', () => {
    expect(retry()(2, failedWith(500))).toBe(false);
  });
});
