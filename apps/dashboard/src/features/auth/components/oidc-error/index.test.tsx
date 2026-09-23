import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth/endpoints';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { OidcError } from '@/features/auth/components/oidc-error';
import { buildSession } from '@tests/factories';
import { renderWithProviders } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

/** Stores a session and answers the check the component's query makes. */
function signedIn() {
  storeSession(buildSession());

  server.use(http.post(buildAPITestURL(AuthEndpoints.check()), () => HttpResponse.json({})));
}

/**
 * Renders the component in a tree holding the two routes its actions lead to,
 * so a click can be followed rather than only inspected.
 */
function renderError() {
  const root = createRootRoute({ component: Outlet });

  const routes = [
    createRoute({ getParentRoute: () => root, path: '/', component: () => <p>Dashboard</p> }),
    createRoute({ getParentRoute: () => root, path: '/login', component: () => <p>Login page</p> }),
    createRoute({
      getParentRoute: () => root,
      path: '/oidc-error',
      component: () => <OidcError description="Invalid OIDC Token" />,
    }),
  ];

  const router = createRouter({
    routeTree: root.addChildren(routes),
    history: createMemoryHistory({ initialEntries: ['/oidc-error'] }),
  });

  return { ...renderWithProviders(<RouterProvider router={router} />), router };
}

describe('OidcError', () => {
  beforeEach(() => {
    clearStoredSession();
  });

  it("renders the API's own wording for the refusal", async () => {
    renderError();

    expect(await screen.findByText('Invalid OIDC Token')).toBeInTheDocument();
  });

  describe('with a session', () => {
    it('tells the user to start again from the application or login again', async () => {
      signedIn();
      renderError();

      expect(
        await screen.findByText(akMT('oidcModule.errorHelperTextSignedIn'))
      ).toBeInTheDocument();
    });

    it('offers the dashboard, since /login would send a signed-in user back to it', async () => {
      signedIn();

      const { router } = renderError();

      await userEvent.click(await screen.findByRole('link', { name: akMT('dashboardHome') }));

      await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    });

    it('replaces the spent token URL rather than leaving it behind the back button', async () => {
      signedIn();

      const { router } = renderError();

      await userEvent.click(await screen.findByRole('link', { name: akMT('dashboardHome') }));

      await waitFor(() => expect(router.state.location.pathname).toBe('/'));

      expect(router.history).toHaveLength(1);
    });

    it('signs the user out and returns them to the login page', async () => {
      signedIn();

      server.use(http.post(buildAPITestURL(AuthEndpoints.logout()), () => HttpResponse.json({})));

      const { router } = renderError();

      await userEvent.click(await screen.findByRole('button', { name: akMT('loginAgain') }));

      await waitFor(() => expect(router.state.location.pathname).toBe('/login'));

      expect(router.history).toHaveLength(1);
    });
  });

  describe('without a session', () => {
    it('tells the user to login before starting again', async () => {
      renderError();

      expect(
        await screen.findByText(akMT('oidcModule.errorHelperTextSignedOut'))
      ).toBeInTheDocument();
    });

    it('offers the login page', async () => {
      const { router } = renderError();

      await userEvent.click(await screen.findByRole('link', { name: akMT('login') }));

      await waitFor(() => expect(router.state.location.pathname).toBe('/login'));

      expect(router.history).toHaveLength(1);
    });
  });
});
