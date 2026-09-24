import { http, HttpResponse, type JsonBodyType } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { OidcEndpoints, OidcService } from '@irene/api/services/oidc';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildAPITestURL, server } from '@tests/server';

const TOKEN = 'oidc-token';
const CALLBACK = 'https://client.test/callback?code=abc&state=xyz';

const validateUrl = buildAPITestURL(OidcEndpoints.validate());
const authorizationUrl = buildAPITestURL(OidcEndpoints.authorization());
const authorizeUrl = buildAPITestURL(OidcEndpoints.authorize());

/** Records the body a request carried, and answers it. */
const recordBody = (url: string, answer: JsonBodyType) => {
  const sent: { body?: Record<string, unknown> } = {};

  server.use(
    http.post(url, async ({ request }) => {
      sent.body = (await request.json()) as Record<string, unknown>;

      return HttpResponse.json(answer);
    })
  );

  return sent;
};

describe('OidcService.validateToken', () => {
  it('posts the token from the client redirect', async () => {
    const sent = recordBody(validateUrl, { valid: true, redirect_url: null, error: null });

    await OidcService.validateToken(TOKEN);

    expect(sent.body).toEqual({ oidc_token: TOKEN });
  });

  it("rejects with the body, which carries the client's callback URL", async () => {
    server.use(
      http.post(validateUrl, () =>
        HttpResponse.json(
          { valid: false, redirect_url: CALLBACK, error: null },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    const error = await OidcService.validateToken(TOKEN).catch((reason: unknown) => reason);

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.BAD_REQUEST);
  });
});

describe('OidcService.getAuthorization', () => {
  it('returns the client name and the scopes it requests', async () => {
    const authorization = {
      form_data: { authorization_needed: true, client_name: 'Acme', scopes: ['openid'] },
    };

    server.use(http.post(authorizationUrl, () => HttpResponse.json(authorization)));

    await expect(OidcService.getAuthorization(TOKEN)).resolves.toEqual(authorization);
  });
});

describe('OidcService.authorize', () => {
  it('posts allow true alongside the token', async () => {
    const sent = recordBody(authorizeUrl, { valid: true, redirect_url: CALLBACK, error: null });

    await OidcService.authorize({ token: TOKEN, allow: true });

    expect(sent.body).toEqual({ oidc_token: TOKEN, allow: true });
  });

  it('posts allow false alongside the token', async () => {
    const sent = recordBody(authorizeUrl, { valid: true, redirect_url: CALLBACK, error: null });

    await OidcService.authorize({ token: TOKEN, allow: false });

    expect(sent.body).toEqual({ oidc_token: TOKEN, allow: false });
  });
});
