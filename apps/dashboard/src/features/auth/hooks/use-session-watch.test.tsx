import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import {
  getStoredSession,
  IRENE_AUTH_SESSION_KEY,
  storeSession,
  type IreneAuthSession,
} from '@irene/api/utils/session';

import { AuthEndpoints } from '@irene/api/services/auth';
import { akMT } from '@irene/translations/intl';

import { authKeys } from '@/features/auth/queries/keys';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const session: IreneAuthSession = { token: 'tok3n', userId: 42, b64token: 'NDI6dG9rM24=' };

/** Sign in and reach the dashboard. */
async function signedIn() {
  storeSession(session);
  server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

  return renderAtRoute('/');
}

/** What the browser dispatches when another tab writes to storage. */
function storageChangedElsewhere(key: string | null) {
  window.dispatchEvent(new StorageEvent('storage', { key, storageArea: window.localStorage }));
}

afterEach(() => {
  window.localStorage.clear();
});

describe('useSessionWatch', () => {
  it('signs this tab out when another tab clears the session', async () => {
    const { router } = await signedIn();

    await screen.findByRole('button', { name: 'Logout' });

    window.localStorage.removeItem(IRENE_AUTH_SESSION_KEY);
    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toEqual({ unauthenticated: true });
  });

  it('signs out when the whole store is cleared, which reports a null key', async () => {
    const { router } = await signedIn();

    await screen.findByRole('button', { name: 'Logout' });

    window.localStorage.clear();
    storageChangedElsewhere(null);

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('stays put when an unrelated key changes', async () => {
    const { router } = await signedIn();

    await screen.findByRole('button', { name: 'Logout' });

    storageChangedElsewhere('some-other-key');

    expect(router.state.location.pathname).toBe('/');
    expect(getStoredSession()).toEqual(session);
  });

  it('stays put when the session is still there, since a rewrite is not a sign-out', async () => {
    const { router } = await signedIn();

    await screen.findByRole('button', { name: 'Logout' });

    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);

    expect(router.state.location.pathname).toBe('/');
  });

  it('empties the cache too, so a guard cannot read a session that is gone', async () => {
    const { router, queryClient } = await signedIn();

    await screen.findByRole('button', { name: 'Logout' });

    window.localStorage.removeItem(IRENE_AUTH_SESSION_KEY);
    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(queryClient.getQueryData(authKeys.session())).toBeNull();
  });
});

describe('useSignedInElsewhere', () => {
  it('follows another tab into the dashboard once it signs in', async () => {
    server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

    const { router } = await renderAtRoute('/login');

    await screen.findByLabelText(akMT('usernameEmailIdTextLabel'));

    storeSession(session);
    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('stays on login while no session appears', async () => {
    const { router } = await renderAtRoute('/login');

    await screen.findByLabelText(akMT('usernameEmailIdTextLabel'));

    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);
    expect(router.state.location.pathname).toBe('/login');
  });

  it('follows from a password reset too, since that user is signed out as well', async () => {
    server.use(
      http.get(buildAPITestURL(AuthEndpoints.resetPassword('tok')), () => HttpResponse.json({}))
    );

    server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

    const { router } = await renderAtRoute('/reset/tok');

    await screen.findByLabelText(akMT('newPassword'));

    storeSession(session);
    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });
});
