import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import {
  getApiErrorMessage,
  getFirstApiErrorMessage,
  parseApiFieldErrors,
} from '@irene/api/utils/errors';

describe('parseApiFieldErrors', () => {
  it('keeps per-field messages', () => {
    expect(parseApiFieldErrors({ username: ['Already taken'] })).toEqual({
      username: ['Already taken'],
    });
  });

  it('files detail under non_field_errors', () => {
    expect(parseApiFieldErrors({ detail: 'Invalid credentials' })).toEqual({
      non_field_errors: ['Invalid credentials'],
    });
  });

  it.each([
    ['a string payload', 'boom'],
    ['an array payload', ['boom']],
    ['null', null],
  ])('returns nothing for %s', (_label, payload) => {
    expect(parseApiFieldErrors(payload)).toEqual({});
  });

  it('drops keys carrying no message', () => {
    expect(parseApiFieldErrors({ username: [], code: 42 })).toEqual({});
  });
});

describe('getFirstApiErrorMessage', () => {
  it('returns the first message across fields', () => {
    expect(getFirstApiErrorMessage({ username: ['Already taken'] })).toBe('Already taken');
  });

  it('returns undefined when there are none', () => {
    expect(getFirstApiErrorMessage({})).toBeUndefined();
  });
});

describe('getApiErrorMessage', () => {
  const axiosErrorWith = (data: unknown) =>
    new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', undefined, undefined, {
      data,
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new AxiosHeaders() },
    });

  it('prefers the message the API sent', () => {
    expect(getApiErrorMessage(axiosErrorWith({ detail: 'Invalid credentials' }))).toBe(
      'Invalid credentials'
    );
  });

  it('falls back to the axios message when the body has none', () => {
    expect(getApiErrorMessage(axiosErrorWith({}))).toBe('Request failed with status code 401');
  });

  it('uses the message of a plain error', () => {
    expect(getApiErrorMessage(new Error('Network down'))).toBe('Network down');
  });

  it('uses a thrown string as is', () => {
    expect(getApiErrorMessage('boom')).toBe('boom');
  });

  it('falls back to a generic message for anything else', () => {
    expect(getApiErrorMessage({ reason: 'boom' })).toBe('Something went wrong');
  });
});
