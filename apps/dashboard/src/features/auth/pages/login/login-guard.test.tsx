import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

/** Where a signed-in account lands, after the home page hands it its one product. */
const SIGNED_IN_LANDING = '/dashboard/projects';

const session = buildSession();

/** Let the session check pass, so the app reads as signed in. */
const signedIn = () => {
  storeSession(session);
  server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));
};

afterEach(() => {
  window.localStorage.clear();
});

describe('the login guard', () => {
  it('redirects a signed-in user away from /login', async () => {
    signedIn();

    const { router } = await renderAtRoute('/login');

    await waitFor(() => expect(router.state.location.pathname).toBe(SIGNED_IN_LANDING));
  });

  it('renders /login for a signed-out user without sending api/check', async () => {
    // No handler registered: any request would fail the run.
    const { router } = await renderAtRoute('/login');

    expect(router.state.location.pathname).toBe('/login');
    expect(await screen.findByLabelText(akMT('usernameEmailIdTextLabel'))).toBeInTheDocument();
  });
});

describe('the other unauthenticated routes', () => {
  it('renders /reset/:token for a signed-in user', async () => {
    signedIn();

    server.use(
      http.get(buildAPITestURL(AuthEndpoints.resetPassword('tok')), () => HttpResponse.json({}))
    );

    const { router } = await renderAtRoute('/reset/tok');

    expect(await screen.findByLabelText(akMT('newPassword'))).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/reset/tok');
  });

  it('renders /recover for a signed-in user', async () => {
    signedIn();

    const { router } = await renderAtRoute('/recover');

    expect(screen.getByLabelText(akMT('usernameEmailIdTextLabel'))).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/recover');
  });

  it('renders the SSO redirect route for a signed-in user', async () => {
    signedIn();

    server.use(
      http.post(buildAPITestURL(AuthEndpoints.samlLogin()), () =>
        HttpResponse.json({ token: 'new-tok3n', user_id: 7 })
      )
    );

    const { router } = await renderAtRoute('/saml2/redirect?sso_token=from-idp');

    await waitFor(() => expect(router.state.location.pathname).toBe(SIGNED_IN_LANDING));
  });
});
