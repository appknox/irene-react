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

/** Where a signed-in account lands, after the home page hands it its one product. */
const SIGNED_IN_LANDING = '/dashboard/projects';

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
  it('stores the session built from the token in the callback URL', async () => {
    server.use(http.post(SAML_LOGIN_URL, () => HttpResponse.json({ token: 'tok3n', user_id: 42 })));

    const { router } = await renderAtRoute('/saml2/redirect?sso_token=from-idp');

    await waitFor(() => expect(router.state.location.pathname).toBe(SIGNED_IN_LANDING));
    expect(getStoredSession()).toEqual(buildSession({ userId: 42, token: 'tok3n' }));
  });

  it('navigates to the dashboard and renders no error', async () => {
    server.use(http.post(SAML_LOGIN_URL, () => HttpResponse.json({ token: 'tok3n', user_id: 42 })));

    const { router } = await renderAtRoute('/saml2/redirect?sso_token=from-idp');

    await waitFor(() => expect(router.state.location.pathname).toBe(SIGNED_IN_LANDING));

    // The success path throws its own redirect; catching it would toast a failure.
    expect(screen.queryByText(akMT('ssoLoginFailed'))).not.toBeInTheDocument();
  });

  it("renders the provider's error and navigates to /login", async () => {
    const { router } = await renderAtRoute('/saml2/redirect?err=SAML+assertion+expired');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText('SAML assertion expired')).toBeInTheDocument();
    expect(getStoredSession()).toBeNull();
  });

  it('navigates to /login when the callback URL carries no token', async () => {
    const { router } = await renderAtRoute('/saml2/redirect');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText(akMT('ssoLoginFailed'))).toBeInTheDocument();
  });

  it('navigates to /login when the token is refused', async () => {
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
  it('exchanges the code for a session and navigates to the dashboard', async () => {
    let body: unknown;

    server.use(
      http.post(OIDC_CALLBACK_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(OIDC_USER);
      })
    );

    const { router } = await renderAtRoute('/sso/oidc/redirect?code=abc&state=xyz');

    await waitFor(() => expect(router.state.location.pathname).toBe(SIGNED_IN_LANDING));
    expect(body).toEqual({ code: 'abc', state: 'xyz' });
    expect(getStoredSession()?.userId).toBe(42);
  });

  it('sends the code exchange request once', async () => {
    let exchanges = 0;

    server.use(
      http.post(OIDC_CALLBACK_URL, () => {
        exchanges += 1;

        return HttpResponse.json(OIDC_USER);
      })
    );

    const { router } = await renderAtRoute('/sso/oidc/redirect?code=abc');

    await waitFor(() => expect(router.state.location.pathname).toBe(SIGNED_IN_LANDING));
    expect(exchanges).toBe(1);
  });

  it("renders the provider's description rather than its error code", async () => {
    const { router } = await renderAtRoute(
      '/sso/oidc/redirect?error=access_denied&error_description=You+declined+the+request'
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText('You declined the request')).toBeInTheDocument();
  });

  it('renders the error code when the provider sent no description', async () => {
    const { router } = await renderAtRoute('/sso/oidc/redirect?error=access_denied');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText('access_denied')).toBeInTheDocument();
  });

  it('renders the missing-code error when the callback URL carries no code', async () => {
    const { router } = await renderAtRoute('/sso/oidc/redirect');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(await screen.findByText(akMT('ssoSettings.oidc.missingCode'))).toBeInTheDocument();
  });

  it('renders the error when the server refuses the code exchange', async () => {
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
