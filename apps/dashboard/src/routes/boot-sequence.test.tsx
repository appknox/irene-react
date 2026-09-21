import { waitFor } from '@testing-library/react';
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

describe('the boot sequence', () => {
  it('asks the install about itself, whoever is looking', async () => {
    await renderAtRoute('/login');

    expect(requested).toContain(`/${ConfigurationEndpoints.frontend()}`);
    expect(requested).toContain(`/${ConfigurationEndpoints.server()}`);
  });

  it('asks nothing about a session nobody stored', async () => {
    await renderAtRoute('/login');

    expect(requested).not.toContain(`/${AuthEndpoints.check()}`);
  });

  it('confirms a stored token before asking anything else', async () => {
    storeSession(session);
    server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

    await renderAtRoute('/');

    expect(requested.indexOf(`/${AuthEndpoints.check()}`)).toBe(0);
  });

  it('confirms a stored token even on a signed-out page, which then turns the user away', async () => {
    storeSession(session);
    server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

    const { router } = await renderAtRoute('/login');

    expect(requested).toContain(`/${AuthEndpoints.check()}`);

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('checks it once, however many guards ask', async () => {
    storeSession(session);
    server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));

    const { router } = await renderAtRoute('/');

    await router.navigate({ to: '/login' });
    await router.navigate({ to: '/' });

    const checks = requested.filter((path) => path === `/${AuthEndpoints.check()}`);

    expect(checks).toHaveLength(1);
  });

  it('signs out a credential the API no longer accepts', async () => {
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
