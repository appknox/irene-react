import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const session = buildSession();

/** Let the session check pass, so the authenticated pages render. */
const signedIn = () => {
  storeSession(session);
  server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));
};

afterEach(() => {
  window.localStorage.clear();
});

describe('DocumentHead', () => {
  it('renders the document title as page name then product name', async () => {
    signedIn();
    mockOrganizationFeatures({ storeknox: true }); // So `/` rests on the home page.

    await renderAtRoute('/');

    await waitFor(() => expect(document.title).toBe(`${akMT('home')} | Appknox`));
  });

  it('renders the document title on an unauthenticated route', async () => {
    await renderAtRoute('/login');

    await waitFor(() => expect(document.title).toBe(`${akMT('login')} | Appknox`));
  });

  it('renders the product name alone for a route with no page title', async () => {
    await renderAtRoute('/no-such-page');

    await waitFor(() => expect(document.title).toBe('Appknox'));
  });
});
