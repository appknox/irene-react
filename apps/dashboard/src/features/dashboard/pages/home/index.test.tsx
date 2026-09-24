import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { configurationStore } from '@irene/api/stores/configuration';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildServerConfiguration, buildSession } from '@tests/factories';
import { mockOrganizationFeatures, mockOrganizationMe } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

/** The home page, which an account with more than one product to choose between sees. */
const HOME = '/dashboard/home';

/** Where a signed-in account lands, after the home page hands it its one product. */
const SIGNED_IN_LANDING = '/dashboard/projects';

/** Where the StoreKnox card leads, until that product is migrated. */
const STOREKNOX_INVENTORY = '/dashboard/storeknox/inventory/app-list';

/** Where the security card leads: an app served separately, so an ordinary link. */
const SECURITY_DASHBOARD = '/security/projects';

/** Puts the tab on an Appknox host, which is what decides the branding. */
const onAppknoxHost = () => {
  vi.spyOn(window, 'location', 'get').mockReturnValue({
    ...window.location,
    href: 'https://secure.appknox.com/dashboard/home',
  } as Location);
};

const openHome = () => renderAtRoute(HOME);

const cardTitles = () =>
  [...document.querySelectorAll('[data-test-product-feature-card-title]')].map(
    (card) => card.textContent
  );

describe('HomePage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
    onAppknoxHost();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('the product cards it renders', () => {
    it('renders the Appknox card for an organization with no other entitlement', async () => {
      mockOrganizationFeatures({ storeknox: true });

      await openHome();

      expect(await screen.findByText(akMT('appknox'))).toBeInTheDocument();
    });

    it('renders the StoreKnox card when features.storeknox is enabled', async () => {
      mockOrganizationFeatures({ storeknox: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('storeknox.title')));
    });

    it('renders the offensive security card when features.offensive_security is enabled', async () => {
      mockOrganizationFeatures({ storeknox: true, offensive_security: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('offensiveSecurity.title')));
    });

    it('renders no offensive security card when features.offensive_security is disabled', async () => {
      mockOrganizationFeatures({ storeknox: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('appknox')));

      expect(cardTitles()).not.toContain(akMT('offensiveSecurity.title'));
    });

    it('renders the reporting card when ai_features.reporting is enabled', async () => {
      mockOrganizationFeatures({ storeknox: true }, { reporting: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('reportModule.title')));
    });

    it('renders no reporting card when the server configuration reports an enterprise install', async () => {
      server.use(
        http.get(`*/${ConfigurationEndpoints.server()}`, () =>
          HttpResponse.json(buildServerConfiguration({ enterprise: true }))
        )
      );

      mockOrganizationFeatures({ storeknox: true }, { reporting: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('storeknox.title')));

      expect(cardTitles()).not.toContain(akMT('reportModule.title'));
    });

    it('renders no StoreKnox card when features.storeknox is disabled', async () => {
      mockOrganizationFeatures({});
      mockOrganizationMe({ has_security_permission: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('appknox')));

      expect(cardTitles()).not.toContain(akMT('storeknox.title'));
    });

    it('renders no security dashboard card when has_security_permission is false', async () => {
      mockOrganizationFeatures({ storeknox: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('appknox')));

      expect(cardTitles()).not.toContain(akMT('securityDashboard'));
    });

    it('renders the cards in order: Appknox, StoreKnox, offensive security, reporting, security dashboard', async () => {
      mockOrganizationFeatures({ storeknox: true, offensive_security: true }, { reporting: true });
      mockOrganizationMe({ has_security_permission: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toHaveLength(5));

      expect(cardTitles()).toEqual([
        akMT('appknox'),
        akMT('storeknox.title'),
        akMT('offensiveSecurity.title'),
        akMT('reportModule.title'),
        akMT('securityDashboard'),
      ]);
    });

    it('renders the security dashboard card when has_security_permission is true', async () => {
      mockOrganizationFeatures({});
      mockOrganizationMe({ has_security_permission: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('securityDashboard')));
    });
  });

  describe('where each card navigates to', () => {
    it('renders the Appknox card as a router link to /dashboard/projects', async () => {
      mockOrganizationFeatures({ storeknox: true });

      const { router } = await openHome();

      const links = await screen.findAllByRole('link', { name: akMT('takeMeToDashboard') });

      await userEvent.click(links[0]);

      await waitFor(() => expect(router.state.location.pathname).toBe(SIGNED_IN_LANDING));
    });

    it('navigates to the StoreKnox app list without a full page load when the user clicks the card', async () => {
      mockOrganizationFeatures({ storeknox: true });

      const { router } = await openHome();

      const links = await screen.findAllByRole('link', { name: akMT('takeMeToDashboard') });

      await userEvent.click(links[1]);

      await waitFor(() => expect(router.state.location.pathname).toBe(STOREKNOX_INVENTORY));
    });

    it('renders the security dashboard card as an anchor to /security/projects, which is served by another app', async () => {
      mockOrganizationFeatures({});
      mockOrganizationMe({ has_security_permission: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('securityDashboard')));

      const links = screen.getAllByRole('link', { name: akMT('takeMeToDashboard') });
      const security = links[links.length - 1];

      expect(security).toHaveAttribute('href', SECURITY_DASHBOARD);
      expect(security).toHaveAttribute('target', '_blank');
      expect(security).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('the /dashboard/home route guard', () => {
    it('redirects to /dashboard/projects when Appknox is the only product the account holds', async () => {
      mockOrganizationFeatures({});

      const { router } = await openHome();

      expect(router.state.location.pathname).toBe(SIGNED_IN_LANDING);
    });

    it('renders the page when features.storeknox is enabled', async () => {
      mockOrganizationFeatures({ storeknox: true });

      const { router } = await openHome();

      expect(router.state.location.pathname).toBe(HOME);
    });

    it('renders the page when has_security_permission is true', async () => {
      mockOrganizationFeatures({});
      mockOrganizationMe({ has_security_permission: true });

      const { router } = await openHome();

      expect(router.state.location.pathname).toBe(HOME);
    });

    it('redirects a signed-in account from / to /dashboard/home', async () => {
      mockOrganizationFeatures({ storeknox: true });

      const { router } = await renderAtRoute('/');

      expect(router.state.location.pathname).toBe(HOME);
    });
  });

  describe('the product names it renders per host', () => {
    it('titles the first two cards Appknox and StoreKnox on an Appknox host', async () => {
      mockOrganizationFeatures({ storeknox: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('appknox')));

      expect(cardTitles()).toContain(akMT('storeknox.title'));
    });

    it('titles the first two cards VAPT and App Monitoring on a whitelabel host', async () => {
      vi.restoreAllMocks();
      mockOrganizationFeatures({ storeknox: true });

      await openHome();

      await waitFor(() => expect(cardTitles()).toContain(akMT('vapt')));

      expect(cardTitles()).toContain(akMT('appMonitoring'));
    });
  });

  it('renders a Logout button', async () => {
    mockOrganizationFeatures({ storeknox: true });

    await openHome();

    expect(await screen.findByRole('button', { name: akMT('logout') })).toBeInTheDocument();
  });

  it('redirects to /login when no session is stored', async () => {
    clearStoredSession();

    const { router } = await openHome();

    expect(router.state.location.pathname).toBe('/login');
  });
});
