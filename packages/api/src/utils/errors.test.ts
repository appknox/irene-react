import { faker } from '@faker-js/faker';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import {
  getApiErrorMessage,
  getApiErrorPayload,
  getApiErrorStatus,
  getApiFieldErrors,
  isNetworkError,
} from '@irene/api/utils/errors';

import { HTTP_STATUS_CODES } from '@irene/constants';

/** An axios rejection carrying a response body, as a failed request produces. */
function refusal(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;

  return new AxiosError(
    'Request failed with status code ' + status,
    String(status),
    config,
    {},
    response
  );
}

/** An axios rejection with no response, as an unreachable server produces. */
const unreachable = () =>
  new AxiosError('Network Error', AxiosError.ERR_NETWORK, { headers: new AxiosHeaders() });

describe('getApiErrorPayload', () => {
  it('returns the body of a refused request', () => {
    const body = { detail: faker.lorem.sentence() };

    expect(getApiErrorPayload(refusal(400, body))).toEqual(body);
  });

  it('returns nothing when the request never reached the server', () => {
    expect(getApiErrorPayload(unreachable())).toBeUndefined();
  });

  it('returns nothing for something that is not an axios error', () => {
    expect(getApiErrorPayload(new Error('boom'))).toBeUndefined();
    expect(getApiErrorPayload('a string')).toBeUndefined();
    expect(getApiErrorPayload(null)).toBeUndefined();
  });

  it('hands back a body that is not a complaint, for the caller to read', () => {
    const challenge = { type: 'TOTP', forced: 'True' };

    expect(getApiErrorPayload<typeof challenge>(refusal(401, challenge))).toEqual(challenge);
  });

  it('hands back the rate limit body, whose detail is an object', () => {
    const body = { detail: { lock_time: 42 } };

    expect(getApiErrorPayload<typeof body>(refusal(429, body))?.detail.lock_time).toBe(42);
  });
});

describe('getApiFieldErrors', () => {
  it('keys each field to its messages', () => {
    const error = refusal(400, { username: ['Already taken'], password: ['Too short'] });

    expect(getApiFieldErrors(error)).toEqual({
      username: ['Already taken'],
      password: ['Too short'],
    });
  });

  it('wraps a single string into a list, as DRF sends either', () => {
    expect(getApiFieldErrors(refusal(400, { username: 'Already taken' }))).toEqual({
      username: ['Already taken'],
    });
  });

  it('files a form-wide detail under non_field_errors', () => {
    expect(getApiFieldErrors(refusal(400, { detail: 'Invalid input' }))).toEqual({
      non_field_errors: ['Invalid input'],
    });
  });

  it('files a top-level array under non_field_errors', () => {
    expect(getApiFieldErrors(refusal(400, ['Invalid input']))).toEqual({
      non_field_errors: ['Invalid input'],
    });
  });

  it('ignores a bare string body, which is how an HTML error page arrives', () => {
    expect(getApiFieldErrors(refusal(500, '<html>Bad Gateway</html>'))).toEqual({});
  });

  it('coerces non-string messages rather than dropping them', () => {
    expect(getApiFieldErrors(refusal(400, { code: [1, 2] }))).toEqual({ code: ['1', '2'] });
  });

  it('drops a field whose messages are empty, so no key is ever an empty list', () => {
    expect(getApiFieldErrors(refusal(400, { a: [], b: ['real'] }))).toEqual({ b: ['real'] });
  });

  it('drops a value it cannot read as messages', () => {
    expect(getApiFieldErrors(refusal(400, { address: { city: ['required'] } }))).toEqual({});
  });

  it('returns an empty object when the request never reached the server', () => {
    expect(getApiFieldErrors(unreachable())).toEqual({});
  });

  it('names the fields a caller expects', () => {
    const errors = getApiFieldErrors<'username' | 'password'>(
      refusal(400, { username: ['Already taken'] })
    );

    expect(errors.username?.[0]).toBe('Already taken');
    expect(errors.password).toBeUndefined();
  });
});

describe('getApiErrorMessage', () => {
  it('reports nothing while the request has not failed', () => {
    expect(getApiErrorMessage(null)).toBeUndefined();
    expect(getApiErrorMessage(undefined)).toBeUndefined();
  });

  it('passes a string through, for a caller that already has the message', () => {
    expect(getApiErrorMessage('Already a message')).toBe('Already a message');
  });

  it.each([
    ['detail', { detail: 'Invalid input' }],
    ['message', { message: 'Account Locked Out' }],
    ['title', { title: 'Server Error' }],
  ])('reads the message from a %s body', (_shape, body) => {
    expect(getApiErrorMessage(refusal(400, body))).toBe(Object.values(body)[0]);
  });

  it('reads the first field message when there is no form-wide one', () => {
    expect(getApiErrorMessage(refusal(400, { username: ['Already taken'] }))).toBe('Already taken');
  });

  it('reads a top-level array', () => {
    expect(getApiErrorMessage(refusal(400, ['Invalid input']))).toBe('Invalid input');
  });

  it('reports nothing for a bare string body, rather than showing an HTML page', () => {
    expect(getApiErrorMessage(refusal(500, '<html>Bad Gateway</html>'))).toBeUndefined();
  });

  it('reports nothing when the body explains nothing', () => {
    expect(getApiErrorMessage(refusal(500, {}))).toBeUndefined();
    expect(getApiErrorMessage(refusal(500, null))).toBeUndefined();
  });

  it("never shows axios's own text, which is written for developers", () => {
    // The rejection's own message reads 'Request failed with status code 500'.
    expect(getApiErrorMessage(refusal(500, {}))).toBeUndefined();
    expect(getApiErrorMessage(unreachable())).toBeUndefined();
  });

  it('reports nothing for a plain Error, which carries no server message', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBeUndefined();
  });
});

describe('getApiErrorStatus', () => {
  it('reads the status of a refused request', () => {
    expect(getApiErrorStatus(refusal(403, {}))).toBe(HTTP_STATUS_CODES.FORBIDDEN);
  });

  it('returns nothing when the request never reached the server', () => {
    expect(getApiErrorStatus(unreachable())).toBeUndefined();
  });

  it('returns nothing for something that is not an axios error', () => {
    expect(getApiErrorStatus(new Error('boom'))).toBeUndefined();
    expect(getApiErrorStatus(null)).toBeUndefined();
  });
});

describe('isNetworkError', () => {
  it('is true when the request never reached the server', () => {
    expect(isNetworkError(unreachable())).toBe(true);
  });

  it('is false when the server answered, however badly', () => {
    expect(isNetworkError(refusal(500, {}))).toBe(false);
  });

  it('is false for something that is not an axios error', () => {
    expect(isNetworkError(new Error('boom'))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});
