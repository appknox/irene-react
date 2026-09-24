import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { storeSession } from '@irene/api/utils/session';

import { buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const session = buildSession();

const requested: string[] = [];

/** The paths the app asked for, in the order it asked. */
const recordRequests = () => {
  server.events.on('request:start', ({ request }) => {
    requested.push(new URL(request.url).pathname);
  });
};

beforeEach(() => {
  requested.length = 0;
  recordRequests();
});

afterEach(() => {
  server.events.removeAllListeners();
  window.localStorage.clear();
});

describe('the app boot sequence', () => {
  it('requests the frontend and server configuration on a signed-out page', async () => {
    await renderAtRoute('/login');

    expect(requested).toContain(`/${ConfigurationEndpoints.frontend()}`);
    expect(requested).toContain(`/${ConfigurationEndpoints.server()}`);
  });

  it('sends no api/check request when no session is stored', async () => {
    await renderAtRoute('/login');

    expect(requested).not.toContain(`/${AuthEndpoints.check()}`);
  });

  it('sends api/check as the first request when a session is stored', async () => {
    storeSession(session);
    server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

    await renderAtRoute('/');

    expect(requested.indexOf(`/${AuthEndpoints.check()}`)).toBe(0);
  });

  it('sends api/check on /login and redirects the signed-in user to /dashboard/projects', async () => {
    storeSession(session);
    server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

    const { router } = await renderAtRoute('/login');

    expect(requested).toContain(`/${AuthEndpoints.check()}`);

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/projects'));
  });

  it('sends api/check once across navigations between / and /login', async () => {
    storeSession(session);
    server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

    const { router } = await renderAtRoute('/');

    // Wrapped: each navigation repaints whatever the new route renders.
    await act(() => router.navigate({ to: '/login' }));
    await act(() => router.navigate({ to: '/' }));

    const checks = requested.filter((path) => path === `/${AuthEndpoints.check()}`);

    expect(checks).toHaveLength(1);
  });

  it('clears the stored session and redirects to /login when api/check answers 401', async () => {
    storeSession(session);

    server.use(
      http.post(buildAPITestURL(AuthEndpoints.check()), () =>
        HttpResponse.json({ detail: 'Invalid token.' }, { status: 401 })
      )
    );

    const { router } = await renderAtRoute('/');

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));

    expect(window.localStorage).toHaveLength(0);
  });
});
