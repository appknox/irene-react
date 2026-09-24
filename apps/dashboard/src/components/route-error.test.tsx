import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth/endpoints';
import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { getStoredSession, storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildOrganization, buildOrganizationMe, buildSession } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const organizationsUrl = buildAPITestURL(OrganizationEndpoints.list());

/** Answers the organization list with a server error until `fixed` is set. */
const failOrganizationsUntilFixed = () => {
  const state = { fixed: false };
  const organization = buildOrganization();

  server.use(
    http.get(organizationsUrl, () => {
      if (state.fixed) {
        return HttpResponse.json({ count: 1, next: null, previous: null, results: [organization] });
      }

      return HttpResponse.json(
        { detail: 'Server error' },
        { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }
      );
    }),
    http.get(buildAPITestURL(OrganizationEndpoints.me(organization.id)), () =>
      HttpResponse.json(buildOrganizationMe())
    )
  );

  return state;
};

/** Puts the tab on an Appknox host, which is what decides whether support is ours to offer. */
const onAppknoxHost = () => {
  vi.spyOn(window, 'location', 'get').mockReturnValue({
    ...window.location,
    href: 'https://secure.appknox.com/dashboard/projects',
  } as Location);
};

describe('RouteError', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('renders the failure message in place of the loading screen', async () => {
    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    expect(await screen.findByText(akMT('couldNotLoadPage'))).toBeInTheDocument();
    expect(screen.getByText(akMT('couldNotLoadPageHint'))).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders a support mailto link carrying the HTTP status', async () => {
    onAppknoxHost();
    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    const support = await screen.findByRole('link', { name: akMT('emailSupport') });

    expect(support).toHaveAttribute(
      'href',
      `mailto:support@appknox.com?subject=${encodeURIComponent(akMT('couldNotLoadPageStatus', { status: 500 }))}`
    );
  });

  it('renders the HTTP status of the failed request', async () => {
    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    expect(
      await screen.findByText(akMT('couldNotLoadPageStatus', { status: 500 }))
    ).toBeInTheDocument();
  });

  it('renders no HTTP status when the request never reached the server', async () => {
    storeSession(buildSession());

    server.use(http.get(organizationsUrl, () => HttpResponse.error()));

    await renderAtRoute('/');

    await screen.findByText(akMT('couldNotLoadPage'));

    expect(document.querySelector('[data-test-route-error-status]')).not.toBeInTheDocument();
  });

  it('renders no support address on a whitelabel host', async () => {
    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    await screen.findByText(akMT('couldNotLoadPage'));

    expect(screen.queryByRole('link', { name: akMT('emailSupport') })).not.toBeInTheDocument();
  });

  it('renders the page when the user clicks Retry and the request succeeds', async () => {
    const user = userEvent.setup();

    storeSession(buildSession());

    const organizations = failOrganizationsUntilFixed();

    await renderAtRoute('/');

    expect(await screen.findByText(akMT('couldNotLoadPage'))).toBeInTheDocument();

    organizations.fixed = true;

    await user.click(screen.getByRole('button', { name: akMT('retry') }));

    await waitFor(() => {
      expect(screen.queryByText(akMT('couldNotLoadPage'))).not.toBeInTheDocument();
    });
  });

  it('keeps the failure message when the retried request fails again', async () => {
    const user = userEvent.setup();

    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    await user.click(await screen.findByRole('button', { name: akMT('retry') }));

    expect(await screen.findByText(akMT('couldNotLoadPage'))).toBeInTheDocument();
  });

  it('renders /login rather than the failure screen when the failure happens there', async () => {
    server.use(
      http.get(organizationsUrl, () =>
        HttpResponse.json({ detail: 'Server error' }, { status: 500 })
      )
    );

    await renderAtRoute('/login');

    expect(screen.queryByText(akMT('couldNotLoadPage'))).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('next') })).toBeInTheDocument();
  });

  it('renders a logout button', async () => {
    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    expect(await screen.findByRole('button', { name: akMT('logout') })).toBeInTheDocument();
  });

  it('clears the stored session when the user clicks Logout', async () => {
    const user = userEvent.setup();

    storeSession(buildSession());
    failOrganizationsUntilFixed();

    server.use(
      http.post(
        buildAPITestURL(AuthEndpoints.logout()),
        () => new HttpResponse(null, { status: 204 })
      )
    );

    await renderAtRoute('/');

    await user.click(await screen.findByRole('button', { name: akMT('logout') }));

    await waitFor(() => expect(getStoredSession()).toBeNull());
  });

  it('renders the underlying error message in a development build', async () => {
    vi.stubEnv('DEV', true);

    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    await screen.findByText(akMT('couldNotLoadPage'));

    expect(document.querySelector('pre')).toBeInTheDocument();
  });

  it('renders no underlying error message in a production build', async () => {
    vi.stubEnv('DEV', false);

    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    await screen.findByText(akMT('couldNotLoadPage'));

    expect(document.querySelector('pre')).not.toBeInTheDocument();
  });
});
