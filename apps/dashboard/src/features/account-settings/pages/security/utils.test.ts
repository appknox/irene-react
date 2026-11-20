import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { isOtpRefusal } from './utils';

/** A refusal shaped as the request client rejects one. */
const refusal = (data: unknown) =>
  new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: HTTP_STATUS_CODES.BAD_REQUEST,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

describe('isOtpRefusal', () => {
  it('reads a refusal naming the otp field as one', () => {
    expect(isOtpRefusal(refusal({ otp: ['Invalid OTP'] }))).toBe(true);
  });

  it('reads any other refusal as something else', () => {
    expect(isOtpRefusal(refusal({ detail: 'Cannot disable' }))).toBe(false);
  });
});
