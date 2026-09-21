import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { getStoredSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const SAML_LOGIN_URL = buildAPITestURL(AuthEndpoints.samlLogin());
const OIDC_CALLBACK_URL = buildAPITestURL(AuthEndpoints.oidcCallback());

const OIDC_USER = {
  message: 'ok',
  provider: 'okta',
  token: 'tok3n',
  user: { id: 42, username: 'jane', email: 'j@x.test', first_name: 'J', last_name: 'D' },
};

afterEach(() => {
  window.localStorage.clear();
});

describe('the SAML callback', () => {
  it('signs the user in with the token the provider sent back', async () => {
    server.use(http.post(SAML_LOGIN_URL, () => HttpResponse.json({ token: 'tok3n', user_id: 42 })));

    const { router } = await renderAtRoute('/saml2/redirect?sso_token=from-idp');

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(getStoredSession()).toEqual(buildSession({ userId: 42, token: 'tok3n' }));
  });

  it('lands the user in the dashboard without an error on the way', async () => {
    server.use(http.post(SAML_LOGIN_URL, () => HttpResponse.json({ token: 'tok3n', user_id: 42 })));

    const { router } = await renderAtRoute('/saml2/redirect?sso_token=from-idp');

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));

    // The success path throws its own redirect; catching it would toast a failure.
    expect(screen.queryByText(akMT('ssoLoginFailed'))).not.toBeInTheDocument();
  });

  it("shows the provider's own error and returns the user to login", async () => {
    const { router } = await renderAtRoute('/saml2/redirect?err=SAML+assertion+expired');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText('SAML assertion expired')).toBeInTheDocument();
    expect(getStoredSession()).toBeNull();
  });

  it('returns the user to login when the provider sent no token at all', async () => {
    const { router } = await renderAtRoute('/saml2/redirect');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText(akMT('ssoLoginFailed'))).toBeInTheDocument();
  });

  it('returns the user to login when the token is refused', async () => {
    server.use(
      http.post(SAML_LOGIN_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.FORBIDDEN })
      )
    );

    const { router } = await renderAtRoute('/saml2/redirect?sso_token=stale');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText(akMT('ssoLoginFailed'))).toBeInTheDocument();
    expect(getStoredSession()).toBeNull();
  });
});

describe('the OIDC callback', () => {
  it('exchanges the code for a session and lands the user in the dashboard', async () => {
    let body: unknown;

    server.use(
      http.post(OIDC_CALLBACK_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(OIDC_USER);
      })
    );

    const { router } = await renderAtRoute('/sso/oidc/redirect?code=abc&state=xyz');

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(body).toEqual({ code: 'abc', state: 'xyz' });
    expect(getStoredSession()?.userId).toBe(42);
  });

  it('exchanges the code exactly once, since the provider will not honour it twice', async () => {
    let exchanges = 0;

    server.use(
      http.post(OIDC_CALLBACK_URL, () => {
        exchanges += 1;

        return HttpResponse.json(OIDC_USER);
      })
    );

    const { router } = await renderAtRoute('/sso/oidc/redirect?code=abc');

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(exchanges).toBe(1);
  });

  it("prefers the provider's description over its error code", async () => {
    const { router } = await renderAtRoute(
      '/sso/oidc/redirect?error=access_denied&error_description=You+declined+the+request'
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText('You declined the request')).toBeInTheDocument();
  });

  it('falls back to the error code when the provider gave no description', async () => {
    const { router } = await renderAtRoute('/sso/oidc/redirect?error=access_denied');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText('access_denied')).toBeInTheDocument();
  });

  it('says the code is missing when the provider sent none', async () => {
    const { router } = await renderAtRoute('/sso/oidc/redirect');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText(akMT('ssoSettings.oidc.missingCode'))).toBeInTheDocument();
  });

  it('reports a code the server will not exchange', async () => {
    server.use(
      http.post(OIDC_CALLBACK_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    const { router } = await renderAtRoute('/sso/oidc/redirect?code=used');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText(akMT('ssoSettings.oidc.authFailed'))).toBeInTheDocument();
    expect(getStoredSession()).toBeNull();
  });
});
