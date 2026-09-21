import { faker } from '@faker-js/faker';
import { isAxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { AuthEndpoints, AuthService } from '@irene/api/services/auth';
import { getApiErrorPayload, getApiErrorStatus } from '@irene/api/utils/errors';
import { buildSsoCheck } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const USERNAME = faker.internet.email();
const IDP_URL = faker.internet.url({ appendSlash: false });
const ORIGIN = 'https://dashboard.example.test';

const CHECK_URL = buildAPITestURL(AuthEndpoints.ssoCheck());

/** Captures the request msw received, so assertions can read what was sent. */
function interceptCheck(respond: () => Response) {
  const seen: { body: unknown; method: string } = { body: undefined, method: '' };

  server.use(
    http.post(CHECK_URL, async ({ request }) => {
      seen.body = await request.json();
      seen.method = request.method;

      return respond();
    })
  );

  return seen;
}

describe('AuthService.checkSso', () => {
  describe('when the organisation is found', () => {
    it('posts to the v2 sso check endpoint', async () => {
      const seen = interceptCheck(() => HttpResponse.json(buildSsoCheck()));

      await AuthService.checkSso(USERNAME);

      expect(seen.method).toBe('POST');
    });

    it('sends only the username', async () => {
      const seen = interceptCheck(() => HttpResponse.json(buildSsoCheck()));

      await AuthService.checkSso(USERNAME);

      expect(seen.body).toEqual({ username: USERNAME });
    });

    it('returns the response body unchanged', async () => {
      const response = buildSsoCheck({ is_saml: true, token: 'tok' });

      interceptCheck(() => HttpResponse.json(response));

      await expect(AuthService.checkSso(USERNAME)).resolves.toEqual(response);
    });
  });

  describe('when the request fails', () => {
    it('keeps the status and the field errors from a 400', async () => {
      interceptCheck(() =>
        HttpResponse.json(
          { username: ['Enter a valid email address.'] },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      );

      const error = await AuthService.checkSso('nope').catch((reason: unknown) => reason);

      expect(isAxiosError(error)).toBe(true);
      expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.BAD_REQUEST);

      expect(getApiErrorPayload(error)).toEqual({
        username: ['Enter a valid email address.'],
      });
    });

    it('rejects rather than resolving undefined on a 403', async () => {
      interceptCheck(() =>
        HttpResponse.json({ detail: 'Forbidden' }, { status: HTTP_STATUS_CODES.FORBIDDEN })
      );

      await expect(AuthService.checkSso(USERNAME)).rejects.toThrow('403');
    });

    it('propagates a server error', async () => {
      interceptCheck(() =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      );

      await expect(AuthService.checkSso(USERNAME)).rejects.toThrow('500');
    });
  });

  describe('edge cases', () => {
    it('sends an empty username rather than dropping the field', async () => {
      const seen = interceptCheck(() => HttpResponse.json(buildSsoCheck()));

      await AuthService.checkSso('');

      expect(seen.body).toEqual({ username: '' });
    });
  });
});

const SAML_START_URL = buildAPITestURL(AuthEndpoints.samlStart());
const SAML_LOGIN_URL = buildAPITestURL(AuthEndpoints.samlLogin());
const OIDC_START_URL = buildAPITestURL(AuthEndpoints.oidcStart());
const OIDC_CALLBACK_URL = buildAPITestURL(AuthEndpoints.oidcCallback());

describe('AuthService.startSaml', () => {
  it('asks the v1 saml endpoint where to send the user, carrying the token and return URL', async () => {
    let query: URLSearchParams | undefined;

    server.use(
      http.get(SAML_START_URL, ({ request }) => {
        query = new URL(request.url).searchParams;

        return HttpResponse.json({ url: IDP_URL });
      })
    );

    const redirect = await AuthService.startSaml({
      token: 'check-token',
      returnTo: `${ORIGIN}/saml2/redirect`,
    });

    expect(redirect.url).toBe(IDP_URL);
    expect(query?.get('token')).toBe('check-token');
    expect(query?.get('return_to')).toBe(`${ORIGIN}/saml2/redirect`);
  });

  it('propagates a refusal rather than sending the user nowhere', async () => {
    server.use(
      http.get(SAML_START_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await expect(
      AuthService.startSaml({ token: 'check-token', returnTo: `${ORIGIN}/saml2/redirect` })
    ).rejects.toThrow('400');
  });
});

describe('AuthService.loginWithSaml', () => {
  it('trades the provider token for a session', async () => {
    let body: unknown;

    server.use(
      http.post(SAML_LOGIN_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({ token: 'tok3n', user_id: 42 });
      })
    );

    await expect(AuthService.loginWithSaml('sso-token')).resolves.toEqual({
      token: 'tok3n',
      user_id: 42,
    });

    expect(body).toEqual({ token: 'sso-token' });
  });

  it('propagates a rejected token', async () => {
    server.use(
      http.post(SAML_LOGIN_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.FORBIDDEN })
      )
    );

    const error = await AuthService.loginWithSaml('stale').catch((reason: unknown) => reason);

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.FORBIDDEN);
  });
});

describe('AuthService.startOidc', () => {
  it('posts the username and the return URL under the name the API expects', async () => {
    let body: unknown;

    server.use(
      http.post(OIDC_START_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({ url: IDP_URL, provider: 'okta' });
      })
    );

    const redirect = await AuthService.startOidc({
      username: USERNAME,
      redirectUri: `${ORIGIN}/sso/oidc/redirect`,
    });

    expect(redirect).toEqual({ url: IDP_URL, provider: 'okta' });

    expect(body).toEqual({
      username: USERNAME,
      redirect_uri: `${ORIGIN}/sso/oidc/redirect`,
    });
  });
});

describe('AuthService.completeOidc', () => {
  it('exchanges the code and state for the signed-in user', async () => {
    let body: unknown;

    server.use(
      http.post(OIDC_CALLBACK_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({
          message: 'ok',
          provider: 'okta',
          token: 'tok3n',
          user: { id: 42, username: 'jane', email: 'j@x.test', first_name: 'J', last_name: 'D' },
        });
      })
    );

    const response = await AuthService.completeOidcLogin({ code: 'abc', state: 'xyz' });

    expect(response.token).toBe('tok3n');
    expect(response.user.id).toBe(42);
    expect(body).toEqual({ code: 'abc', state: 'xyz' });
  });

  it('propagates a code the provider will not honour', async () => {
    server.use(
      http.post(OIDC_CALLBACK_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await expect(AuthService.completeOidcLogin({ code: 'used' })).rejects.toThrow('400');
  });
});
