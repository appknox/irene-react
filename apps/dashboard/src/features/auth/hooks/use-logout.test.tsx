import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { getStoredSession, storeSession, type IreneAuthSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const session: IreneAuthSession = { token: 'tok3n', userId: 42, b64token: 'NDI6dG9rM24=' };

/** Let the session check pass, so the home page is reachable. */
const signedIn = () => {
  storeSession(session);
  server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));
};

/** Open the home page signed in and press Logout. */
async function logout() {
  signedIn();

  const rendered = await renderAtRoute('/');

  await userEvent.click(await screen.findByRole('button', { name: 'Logout' }));

  return rendered;
}

describe('useLogout', () => {
  it('releases the session server-side', async () => {
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

  it('forgets the stored session and returns to the login page', async () => {
    server.use(http.post(buildAPITestURL(AuthEndpoints.logout()), () => HttpResponse.json({})));

    const { router } = await logout();

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(getStoredSession()).toBeNull();
  });

  it('signs the user out even when the server refuses, so they are never left in', async () => {
    server.use(
      http.post(buildAPITestURL(AuthEndpoints.logout()), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.UNAUTHORIZED })
      )
    );

    const { router } = await logout();

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(getStoredSession()).toBeNull();
  });
});
