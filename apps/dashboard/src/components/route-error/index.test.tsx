import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

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

describe('RouteError', () => {
  it('renders the failure message instead of the loading screen', async () => {
    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    expect(await screen.findByText(akMT('couldNotLoadPage'))).toBeInTheDocument();
    expect(screen.getByText(akMT('couldNotLoadPageHint'))).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders a support mailto link', async () => {
    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    const support = await screen.findByRole('link', { name: akMT('emailSupport') });

    expect(support).toHaveAttribute('href', 'mailto:support@appknox.com');
  });

  it('renders the page when a retry succeeds', async () => {
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

  it('keeps the failure message when a retry fails again', async () => {
    const user = userEvent.setup();

    storeSession(buildSession());
    failOrganizationsUntilFixed();

    await renderAtRoute('/');

    await user.click(await screen.findByRole('button', { name: akMT('retry') }));

    expect(await screen.findByText(akMT('couldNotLoadPage'))).toBeInTheDocument();
  });

  it('renders the login page rather than the failure screen for /login', async () => {
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

  it('clears the stored session when logout is clicked', async () => {
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
});
