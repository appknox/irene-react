import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { clearStoredSession, getStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';

import { buildSession } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { watchPageLoad } from '@tests/page-load';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const session = buildSession();

/** Let the session check pass, so the home page is reachable. */
const signedIn = () => {
  storeSession(session);
  server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));
};

/** Open the home page signed in and press Logout. */
async function logout() {
  signedIn();

  /* The control lives on the home page, which needs a product to choose between. */
  mockOrganizationFeatures({ storeknox: true });

  const rendered = await renderAtRoute('/');

  await userEvent.click(await screen.findByRole('button', { name: 'Logout' }));

  return rendered;
}

describe('useLogout', () => {
  let pageLoad: ReturnType<typeof watchPageLoad>;

  beforeEach(() => {
    pageLoad = watchPageLoad();
  });

  afterEach(() => {
    pageLoad.restore();
  });

  it('posts the stored credential to api/logout when the user clicks Logout', async () => {
    let released = false;

    server.use(
      http.post(buildAPITestURL(AuthEndpoints.logout()), ({ request }) => {
        released = request.headers.get('Authorization') === `Basic ${session.b64token}`;

        return HttpResponse.json({});
      })
    );

    await logout();

    await waitFor(() => expect(released).toBe(true));
  });

  it('clears the stored session and loads the login page', async () => {
    server.use(http.post(buildAPITestURL(AuthEndpoints.logout()), () => HttpResponse.json({})));

    await logout();

    await waitFor(() => expect(pageLoad.replace).toHaveBeenCalledWith('/login'));
    expect(getStoredSession()).toBeNull();
  });

  it('clears the stored session and loads the login page when api/logout answers 401', async () => {
    server.use(
      http.post(buildAPITestURL(AuthEndpoints.logout()), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.UNAUTHORIZED })
      )
    );

    await logout();

    await waitFor(() => expect(pageLoad.replace).toHaveBeenCalledWith('/login'));
    expect(getStoredSession()).toBeNull();
  });

  it('posts nothing to api/logout when the session was cleared before the user clicked Logout', async () => {
    let released = false;

    server.use(
      http.post(buildAPITestURL(AuthEndpoints.logout()), () => {
        released = true;

        return HttpResponse.json({});
      })
    );

    signedIn();
    mockOrganizationFeatures({ storeknox: true });

    await renderAtRoute('/');

    /* Cleared between the page rendering and the control being pressed. */
    clearStoredSession();

    await userEvent.click(await screen.findByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(pageLoad.replace).toHaveBeenCalledWith('/login'));

    expect(released).toBe(false);
  });
});
