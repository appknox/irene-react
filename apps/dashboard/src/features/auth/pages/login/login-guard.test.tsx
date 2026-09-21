import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { storeSession, type IreneAuthSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const session: IreneAuthSession = { token: 'tok3n', userId: 42, b64token: 'NDI6dG9rM24=' };

/** Let the session check pass, so the app reads as signed in. */
const signedIn = () => {
  storeSession(session);
  server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));
};

afterEach(() => {
  window.localStorage.clear();
});

describe('the login guard', () => {
  it('turns a signed-in user away from the login page', async () => {
    signedIn();

    const { router } = await renderAtRoute('/login');

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('lets a signed-out user in, without calling the API', async () => {
    // No handler registered: any request would fail the run.
    const { router } = await renderAtRoute('/login');

    expect(router.state.location.pathname).toBe('/login');
    expect(await screen.findByLabelText(akMT('usernameEmailIdTextLabel'))).toBeInTheDocument();
  });
});

describe('the other signed-out pages', () => {
  it('lets a signed-in user reset a password from an emailed link', async () => {
    signedIn();

    server.use(
      http.get(buildAPITestURL(AuthEndpoints.resetPassword('tok')), () => HttpResponse.json({}))
    );

    const { router } = await renderAtRoute('/reset/tok');

    expect(await screen.findByLabelText(akMT('newPassword'))).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/reset/tok');
  });

  it('lets a signed-in user ask for a reset link', async () => {
    signedIn();

    const { router } = await renderAtRoute('/recover');

    expect(screen.getByLabelText(akMT('usernameEmailIdTextLabel'))).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/recover');
  });

  it('does not interfere with an identity provider sending a user back', async () => {
    signedIn();

    server.use(
      http.post(buildAPITestURL(AuthEndpoints.samlLogin()), () =>
        HttpResponse.json({ token: 'new-tok3n', user_id: 7 })
      )
    );

    const { router } = await renderAtRoute('/saml2/redirect?sso_token=from-idp');

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });
});
