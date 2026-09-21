import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import { API_LOGIN_REFUSAL_MESSAGES } from '@irene/api/services/auth';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { getLoginFailure } from '@/features/auth/utils/login-error';

/** An axios rejection carrying a response body, as a failed login produces. */
function refusal(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;

  return new AxiosError('Request failed', String(status), config, {}, response);
}

/** An axios rejection with no response, as an unreachable server produces. */
const unreachable = () =>
  new AxiosError('Network Error', AxiosError.ERR_NETWORK, { headers: new AxiosHeaders() });

describe('getLoginFailure', () => {
  it('says nothing about a rate limit, since the countdown already has', () => {
    const error = refusal(HTTP_STATUS_CODES.TOO_MANY_REQUESTS, { detail: { lock_time: 60 } });

    expect(getLoginFailure(error)).toBeUndefined();
  });

  it('reports nothing while the sign-in has not failed', () => {
    expect(getLoginFailure(null)).toBeUndefined();
    expect(getLoginFailure(undefined)).toBeUndefined();
  });

  it('marks a wrong password for the field itself', () => {
    const error = refusal(HTTP_STATUS_CODES.UNAUTHORIZED, {
      message: API_LOGIN_REFUSAL_MESSAGES.CREDENTIALS_REJECTED,
    });

    expect(getLoginFailure(error)).toEqual({ kind: 'credentials' });
  });

  it('marks a locked account for the field itself', () => {
    const error = refusal(HTTP_STATUS_CODES.UNAUTHORIZED, {
      message: API_LOGIN_REFUSAL_MESSAGES.ACCOUNT_LOCKED,
    });

    expect(getLoginFailure(error)).toEqual({ kind: 'locked' });
  });

  it('passes any other message from the server through to a toast', () => {
    const error = refusal(HTTP_STATUS_CODES.FORBIDDEN, {
      message: 'Your organisation has been suspended',
    });

    expect(getLoginFailure(error)).toEqual({
      kind: 'notify',
      message: 'Your organisation has been suspended',
    });
  });

  it('names the network when the request never reached the server', () => {
    expect(getLoginFailure(unreachable())).toEqual({
      kind: 'notify',
      message: akMT('networkError'),
    });
  });

  it('falls back to a generic message when the body explains nothing', () => {
    const error = refusal(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, '<html>Bad Gateway</html>');

    expect(getLoginFailure(error)).toEqual({
      kind: 'notify',
      message: akMT('pleaseEnterValidAccountDetail'),
    });
  });

  it('reads a second-factor mfaRequirement as a step forward, not a complaint', () => {
    const error = refusal(HTTP_STATUS_CODES.UNAUTHORIZED, { type: 'TOTP', forced: 'True' });

    expect(getLoginFailure(error)).toEqual({
      kind: 'mfa',
      mfaRequirement: { type: 'TOTP', forced: 'True' },
    });
  });

  it('reads a mfaRequirement with no forced flag as optional', () => {
    const error = refusal(HTTP_STATUS_CODES.UNAUTHORIZED, { type: 'HOTP' });

    expect(getLoginFailure(error)).toEqual({
      kind: 'mfa',
      mfaRequirement: { type: 'HOTP' },
    });
  });

  it.each(['true', 'TRUE', 'yes'])(
    'does not read %s as forced, since the server sends True',
    (forced) => {
      const error = refusal(HTTP_STATUS_CODES.UNAUTHORIZED, { type: 'TOTP', forced });

      expect(getLoginFailure(error)).toEqual({
        kind: 'mfa',
        mfaRequirement: { type: 'TOTP' },
      });
    }
  );

  it('does not raise a code step for a factor it cannot render', () => {
    // The user would get an input with no idea what to put in it.
    const error = refusal(HTTP_STATUS_CODES.UNAUTHORIZED, { type: 'SMS' });

    expect(getLoginFailure(error)?.kind).not.toBe('mfa');
  });

  it('reads a message the API sent as a list, as DRF does', () => {
    const error = refusal(HTTP_STATUS_CODES.BAD_REQUEST, {
      message: [API_LOGIN_REFUSAL_MESSAGES.ACCOUNT_LOCKED],
    });

    expect(getLoginFailure(error)).toEqual({
      kind: 'locked',
    });
  });

  it('surfaces a form-wide detail, not just a message field', () => {
    const error = refusal(HTTP_STATUS_CODES.BAD_REQUEST, {
      detail: 'This organisation has been suspended',
    });

    expect(getLoginFailure(error)).toEqual({
      kind: 'notify',
      message: 'This organisation has been suspended',
    });
  });
});
