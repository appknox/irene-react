import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { MfaEndpoints, MfaService } from '@irene/api/services/mfa';
import { getApiFieldErrors } from '@irene/api/utils/errors';
import { buildMfa, buildMfaSetupToken } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const MFA_URL = buildAPITestURL(MfaEndpoints.mfa());

describe('MfaService.getMfaMethods', () => {
  it('returns the methods out of their page', async () => {
    const methods = [buildMfa({ method: 1, enabled: true }), buildMfa({ method: 2 })];

    server.use(
      http.get(MFA_URL, () =>
        HttpResponse.json({ count: 2, next: null, previous: null, results: methods })
      )
    );

    await expect(MfaService.getMfaMethods()).resolves.toEqual(methods);
  });
});

describe('MfaService.requestMfaSetup', () => {
  it('posts the step and returns the setup token it starts', async () => {
    const setupToken = buildMfaSetupToken();
    let body: unknown;

    server.use(
      http.post(MFA_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(setupToken);
      })
    );

    await expect(MfaService.requestMfaSetup({ method: 1 })).resolves.toEqual(setupToken);
    expect(body).toEqual({ method: 1 });
  });

  it('rejects with the otp field when the step needs a code', async () => {
    server.use(
      http.post(MFA_URL, () =>
        HttpResponse.json({ otp: ['OTP is required'] }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    const error = await MfaService.requestMfaSetup({ method: 1 }).catch(
      (reason: unknown) => reason
    );

    expect(getApiFieldErrors(error).otp).toEqual(['OTP is required']);
  });
});

describe('MfaService.confirmMfa', () => {
  it('posts the code with the setup token', async () => {
    const request = { method: 2 as const, otp: '123456', token: buildMfaSetupToken().token };
    let body: unknown;

    server.use(
      http.post(MFA_URL, async ({ request: sent }) => {
        body = await sent.json();

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await MfaService.confirmMfa(request);

    expect(body).toEqual(request);
  });
});

describe('MfaService.disableMfa', () => {
  it('sends the method and code in the body of a DELETE', async () => {
    let body: unknown;

    server.use(
      http.delete(MFA_URL, async ({ request }) => {
        body = await request.json();

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await MfaService.disableMfa({ method: 2, otp: '123456' });

    expect(body).toEqual({ method: 2, otp: '123456' });
  });
});
