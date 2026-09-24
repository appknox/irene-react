import { faker } from '@faker-js/faker';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import {
  getApiErrorMessage,
  getApiErrorPayload,
  getApiErrorStatus,
  getApiFieldErrors,
  isAbortedRequest,
  isNetworkError,
  isRateLimited,
  unlessRateLimited,
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
  it('returns the response body of a failed request', () => {
    const body = { detail: faker.lorem.sentence() };

    expect(getApiErrorPayload(refusal(400, body))).toEqual(body);
  });

  it('returns undefined when the request never reached the server', () => {
    expect(getApiErrorPayload(unreachable())).toBeUndefined();
  });

  it('returns undefined for a value that is not an axios error', () => {
    expect(getApiErrorPayload(new Error('boom'))).toBeUndefined();
    expect(getApiErrorPayload('a string')).toBeUndefined();
    expect(getApiErrorPayload(null)).toBeUndefined();
  });

  it('returns a body that carries no field errors', () => {
    const challenge = { type: 'TOTP', forced: 'True' };

    expect(getApiErrorPayload<typeof challenge>(refusal(401, challenge))).toEqual(challenge);
  });

  it('returns the rate limit body, whose detail is an object', () => {
    const body = { detail: { lock_time: 42 } };

    expect(getApiErrorPayload<typeof body>(refusal(429, body))?.detail.lock_time).toBe(42);
  });
});

describe('getApiFieldErrors', () => {
  it('returns each field keyed to its messages', () => {
    const error = refusal(400, { username: ['Already taken'], password: ['Too short'] });

    expect(getApiFieldErrors(error)).toEqual({
      username: ['Already taken'],
      password: ['Too short'],
    });
  });

  it('wraps a single string message into a list', () => {
    expect(getApiFieldErrors(refusal(400, { username: 'Already taken' }))).toEqual({
      username: ['Already taken'],
    });
  });

  it('keys a form-wide detail under non_field_errors', () => {
    expect(getApiFieldErrors(refusal(400, { detail: 'Invalid input' }))).toEqual({
      non_field_errors: ['Invalid input'],
    });
  });

  it('keys a top-level array under non_field_errors', () => {
    expect(getApiFieldErrors(refusal(400, ['Invalid input']))).toEqual({
      non_field_errors: ['Invalid input'],
    });
  });

  it('returns no messages for a body that is a bare string', () => {
    expect(getApiFieldErrors(refusal(500, '<html>Bad Gateway</html>'))).toEqual({});
  });

  it('converts a non-string message to a string', () => {
    expect(getApiFieldErrors(refusal(400, { code: [1, 2] }))).toEqual({ code: ['1', '2'] });
  });

  it('omits a field whose message list is empty', () => {
    expect(getApiFieldErrors(refusal(400, { a: [], b: ['real'] }))).toEqual({ b: ['real'] });
  });

  it('omits a value it cannot read as messages', () => {
    expect(getApiFieldErrors(refusal(400, { address: { city: ['required'] } }))).toEqual({});
  });

  it('returns an empty object when the request never reached the server', () => {
    expect(getApiFieldErrors(unreachable())).toEqual({});
  });

  it('returns the field names the body carries', () => {
    const errors = getApiFieldErrors<'username' | 'password'>(
      refusal(400, { username: ['Already taken'] })
    );

    expect(errors.username?.[0]).toBe('Already taken');
    expect(errors.password).toBeUndefined();
  });
});

describe('getApiErrorMessage', () => {
  it('returns undefined when no error was given', () => {
    expect(getApiErrorMessage(null)).toBeUndefined();
    expect(getApiErrorMessage(undefined)).toBeUndefined();
  });

  it('returns a string argument unchanged', () => {
    expect(getApiErrorMessage('Already a message')).toBe('Already a message');
  });

  it.each([
    ['detail', { detail: 'Invalid input' }],
    ['message', { message: 'Account Locked Out' }],
    ['title', { title: 'Server Error' }],
  ])('reads the message from a %s body', (_shape, body) => {
    expect(getApiErrorMessage(refusal(400, body))).toBe(Object.values(body)[0]);
  });

  it('returns the first field message when the body carries no form-wide one', () => {
    expect(getApiErrorMessage(refusal(400, { username: ['Already taken'] }))).toBe('Already taken');
  });

  it('returns the first entry of a top-level array', () => {
    expect(getApiErrorMessage(refusal(400, ['Invalid input']))).toBe('Invalid input');
  });

  it('returns undefined for a body that is a bare string', () => {
    expect(getApiErrorMessage(refusal(500, '<html>Bad Gateway</html>'))).toBeUndefined();
  });

  it('returns undefined when the body carries no message', () => {
    expect(getApiErrorMessage(refusal(500, {}))).toBeUndefined();
    expect(getApiErrorMessage(refusal(500, null))).toBeUndefined();
  });

  it("returns undefined rather than axios's own message text", () => {
    // The rejection's own message reads 'Request failed with status code 500'.
    expect(getApiErrorMessage(refusal(500, {}))).toBeUndefined();
    expect(getApiErrorMessage(unreachable())).toBeUndefined();
  });

  it('returns undefined for a plain Error', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBeUndefined();
  });
});

describe('getApiErrorStatus', () => {
  it('returns the status of a failed request', () => {
    expect(getApiErrorStatus(refusal(403, {}))).toBe(HTTP_STATUS_CODES.FORBIDDEN);
  });

  it('returns undefined when the request never reached the server', () => {
    expect(getApiErrorStatus(unreachable())).toBeUndefined();
  });

  it('returns undefined for a value that is not an axios error', () => {
    expect(getApiErrorStatus(new Error('boom'))).toBeUndefined();
    expect(getApiErrorStatus(null)).toBeUndefined();
  });
});

describe('isNetworkError', () => {
  it('is true when the request never reached the server', () => {
    expect(isNetworkError(unreachable())).toBe(true);
  });

  it('is false when the server answered with any status', () => {
    expect(isNetworkError(refusal(500, {}))).toBe(false);
  });

  it('is false for a value that is not an axios error', () => {
    expect(isNetworkError(new Error('boom'))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});

describe('isRateLimited', () => {
  it('is true for a 429', () => {
    expect(isRateLimited(refusal(HTTP_STATUS_CODES.TOO_MANY_REQUESTS, {}))).toBe(true);
  });

  it('is false for any other status', () => {
    expect(isRateLimited(refusal(HTTP_STATUS_CODES.UNAUTHORIZED, {}))).toBe(false);
  });

  it('is false for a value that is not an API error', () => {
    expect(isRateLimited(new Error('nope'))).toBe(false);
  });
});

describe('isAbortedRequest', () => {
  it('is true for a request that timed out', () => {
    expect(isAbortedRequest(new AxiosError('timeout', AxiosError.ECONNABORTED))).toBe(true);
  });

  it('is true for a request an abort signal cancelled', () => {
    expect(isAbortedRequest(new AxiosError('cancelled', AxiosError.ERR_CANCELED))).toBe(true);
  });

  it('is false for a request that never reached the server', () => {
    expect(isAbortedRequest(unreachable())).toBe(false);
  });

  it('is false for a request the server refused', () => {
    expect(isAbortedRequest(refusal(500, {}))).toBe(false);
  });

  it('is false for a value that is not an axios error', () => {
    expect(isAbortedRequest(new Error('boom'))).toBe(false);
  });
});

describe('unlessRateLimited', () => {
  it('calls the handler for a status other than 429', () => {
    const handler = vi.fn();

    unlessRateLimited(handler)(refusal(HTTP_STATUS_CODES.BAD_REQUEST, {}));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('calls no handler for a 429', () => {
    const handler = vi.fn();

    unlessRateLimited(handler)(refusal(HTTP_STATUS_CODES.TOO_MANY_REQUESTS, {}));
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes every argument through to the handler', () => {
    const handler = vi.fn();
    const error = refusal(HTTP_STATUS_CODES.BAD_REQUEST, {});

    unlessRateLimited(handler)(error, { username: 'jane' });
    expect(handler).toHaveBeenCalledWith(error, { username: 'jane' });
  });

  it('calls the handler for a value that is not an API error', () => {
    const handler = vi.fn();

    unlessRateLimited(handler)(new Error('nope'));
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('a body that is an empty list', () => {
  it('returns no field errors', () => {
    expect(getApiFieldErrors(refusal(HTTP_STATUS_CODES.BAD_REQUEST, []))).toEqual({});
  });
});
