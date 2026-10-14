import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { mockOrganizationFeatures, mockOrganizationMe } from '@tests/organization';
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
  vi.unstubAllGlobals();
});

describe('DocumentHead', () => {
  it('reads page then deployment name on a page that belongs to no product', async () => {
    signedIn();
    mockOrganizationFeatures({ storeknox: true }); // So `/` rests on the home page.

    await renderAtRoute('/');

    await waitFor(() => expect(document.title).toBe(`${akMT('home')} | Appknox`));
  });

  it('names the product between the page and the deployment, on a dashboard page', async () => {
    signedIn();

    await renderAtRoute('/dashboard/projects');

    await waitFor(() =>
      expect(document.title).toBe(`${akMT('projects')} | ${akMT('vapt')} | Appknox`)
    );
  });

  it('names the partner dashboard between the clients page and the deployment', async () => {
    signedIn();
    mockOrganizationMe({ can_access_partner_dashboard: true });

    await renderAtRoute('/partner/clients');

    await waitFor(() =>
      expect(document.title).toBe(`${akMT('clients')} | ${akMT('partner')} | Appknox`)
    );
  });

  it('names the module after itself on an Appknox host', async () => {
    vi.stubGlobal('location', { ...window.location, href: 'https://secure.appknox.com/' });

    signedIn();

    await renderAtRoute('/dashboard/projects');

    await waitFor(() =>
      /* The module and the install share a name on an Appknox host, so it is said once. */
      expect(document.title).toBe(`${akMT('projects')} | Appknox`)
    );
  });

  it('reads page, then product, then the deployment name', async () => {
    signedIn();

    await renderAtRoute('/dashboard/reports');

    await waitFor(() =>
      expect(document.title).toBe(
        `${akMT('reportModule.generateReport')} | ${akMT('reportModule.title')} | Appknox`
      )
    );
  });

  it('reads page then deployment name on a signed-out route', async () => {
    await renderAtRoute('/login');

    await waitFor(() => expect(document.title).toBe(`${akMT('login')} | Appknox`));
  });

  it('reads the deployment name alone on a route that names no page', async () => {
    await renderAtRoute('/no-such-page');

    await waitFor(() => expect(document.title).toBe('Appknox'));
  });
});
