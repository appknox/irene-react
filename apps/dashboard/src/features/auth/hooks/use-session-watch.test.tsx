import { act, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { getStoredSession, IRENE_AUTH_SESSION_KEY, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { authKeys } from '@/features/auth/queries/keys';
import { buildSession } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

/** The home page, which an account with more than one product to choose between sees. */
const HOME = '/dashboard/home';

const session = buildSession();

/** Sign in and reach the dashboard. */
async function signedIn() {
  storeSession(session);
  server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

  /* The pages under test are read through the home page, which needs a choice to render. */
  mockOrganizationFeatures({ storeknox: true });

  return renderAtRoute('/');
}

/** What the browser dispatches when another tab writes to storage. */
function storageChangedElsewhere(key: string | null) {
  // Wrapped: the watcher navigates on this, which repaints the page.
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key, storageArea: window.localStorage }));
  });
}

afterEach(() => {
  window.localStorage.clear();
});

describe('useSessionWatch', () => {
  it('navigates to /login when another tab removes the session key from localStorage', async () => {
    const { router } = await signedIn();

    await screen.findByRole('button', { name: 'Logout' });

    window.localStorage.removeItem(IRENE_AUTH_SESSION_KEY);
    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toEqual({ unauthenticated: true });
  });

  it('navigates to /login when a storage event reports a null key', async () => {
    const { router } = await signedIn();

    await screen.findByRole('button', { name: 'Logout' });

    window.localStorage.clear();
    storageChangedElsewhere(null);

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('does not navigate when a storage event names an unrelated key', async () => {
    const { router } = await signedIn();

    await screen.findByRole('button', { name: 'Logout' });

    storageChangedElsewhere('some-other-key');

    expect(router.state.location.pathname).toBe(HOME);
    expect(getStoredSession()).toEqual(session);
  });

  it('does not navigate when the session key is rewritten with a session still stored', async () => {
    const { router } = await signedIn();

    await screen.findByRole('button', { name: 'Logout' });

    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);

    expect(router.state.location.pathname).toBe(HOME);
  });

  it('clears the query cache alongside the session', async () => {
    const { router, queryClient } = await signedIn();

    await screen.findByRole('button', { name: 'Logout' });

    window.localStorage.removeItem(IRENE_AUTH_SESSION_KEY);
    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(queryClient.getQueryData(authKeys.session())).toBeNull();
  });
});

describe('useSignedInElsewhere', () => {
  it('navigates to the dashboard when another tab writes a session', async () => {
    server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

    const { router } = await renderAtRoute('/login');

    await screen.findByLabelText(akMT('usernameEmailIdTextLabel'));

    storeSession(session);
    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);

    await waitFor(() => expect(router.state.location.pathname).toBe(HOME));
  });

  it('stays on /login while no session is written', async () => {
    const { router } = await renderAtRoute('/login');

    await screen.findByLabelText(akMT('usernameEmailIdTextLabel'));

    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);
    expect(router.state.location.pathname).toBe('/login');
  });

  it('navigates to the dashboard from /reset/:token when another tab writes a session', async () => {
    server.use(
      http.get(buildAPITestURL(AuthEndpoints.resetPassword('tok')), () => HttpResponse.json({}))
    );

    server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

    const { router } = await renderAtRoute('/reset/tok');

    await screen.findByLabelText(akMT('newPassword'));

    storeSession(session);
    storageChangedElsewhere(IRENE_AUTH_SESSION_KEY);

    await waitFor(() => expect(router.state.location.pathname).toBe(HOME));
  });
});
