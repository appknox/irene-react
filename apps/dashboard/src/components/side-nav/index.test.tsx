import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigurationEndpoints } from '@irene/api/services/configuration/endpoints';
import { storeSession } from '@irene/api/utils/session';
import { PRODUCT_VERSIONS } from '@irene/config/product';
import { akMT } from '@irene/translations/intl';

import { buildFrontendConfiguration, buildSession } from '@tests/factories';
import { mockOrganizationFeatures, mockOrganizationMe } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

/** A page inside the chrome, so the navigation is on screen. */
const PROJECTS = '/dashboard/projects';

const openProjects = () => renderAtRoute(PROJECTS);

/** Answers the frontend configuration with, or without, a key for the chat widget. */
const mockFreshchatKey = (freshchat_key: string) => {
  const configuration = buildFrontendConfiguration();

  server.use(
    http.get(`*/${ConfigurationEndpoints.frontend()}`, () =>
      HttpResponse.json({
        ...configuration,
        integrations: { ...configuration.integrations, freshchat_key },
      })
    )
  );
};

const navItem = (label: string) => screen.getByRole('link', { name: label });

describe('SideNav', () => {
  beforeEach(() => {
    storeSession(buildSession());
    mockOrganizationFeatures({});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('leads to the projects every account has', async () => {
    await openProjects();

    await waitFor(() => expect(navItem(akMT('allProjects'))).toHaveAttribute('href', PROJECTS));
  });

  it('counts the organization projects beside the item, once there is room to show it', async () => {
    await openProjects();

    await userEvent.click(await screen.findByRole('button', { name: akMT('expand') }));

    await waitFor(() => expect(document.querySelector('[data-slot="chip"]')).toBeInTheDocument());
  });

  it('marks the page the account is on', async () => {
    await openProjects();

    await waitFor(() =>
      expect(navItem(akMT('allProjects'))).toHaveAttribute('data-status', 'active')
    );
  });

  it('leaves the API documentation out until the organization buys the public APIs', async () => {
    await openProjects();

    await waitFor(() => expect(navItem(akMT('allProjects'))).toBeInTheDocument());

    expect(screen.queryByRole('link', { name: akMT('apiDocumentation') })).not.toBeInTheDocument();
  });

  it('offers it once they have', async () => {
    mockOrganizationFeatures({ public_apis: true });

    await openProjects();

    await waitFor(() => expect(navItem(akMT('apiDocumentation'))).toBeInTheDocument());
  });

  it('keeps analytics from a member and offers it to an owner', async () => {
    await openProjects();

    await waitFor(() => expect(navItem(akMT('allProjects'))).toBeInTheDocument());

    expect(screen.queryByRole('link', { name: akMT('analytics') })).not.toBeInTheDocument();
  });

  it('offers analytics to an owner', async () => {
    mockOrganizationMe({ is_owner: true });

    await openProjects();

    await waitFor(() => expect(navItem(akMT('analytics'))).toBeInTheDocument());
  });

  describe('the collapse control', () => {
    it('starts collapsed, so the page has its full width on a first visit', async () => {
      await openProjects();

      const toggle = await screen.findByRole('button', { name: akMT('expand') });

      expect(toggle).toBeInTheDocument();
    });

    it('expands on a press, and says so', async () => {
      await openProjects();

      await userEvent.click(await screen.findByRole('button', { name: akMT('expand') }));

      expect(await screen.findByRole('button', { name: akMT('collapse') })).toBeInTheDocument();
    });

    it('remembers the choice for the next visit', async () => {
      const { unmount } = await openProjects();

      await userEvent.click(await screen.findByRole('button', { name: akMT('expand') }));
      await screen.findByRole('button', { name: akMT('collapse') });

      /* Torn down first, so the second visit is the only navigation on screen. */
      unmount();

      await openProjects();

      expect(await screen.findByRole('button', { name: akMT('collapse') })).toBeInTheDocument();
    });
  });

  describe('the product switcher', () => {
    it('opens on the control, offering the products this account may open', async () => {
      mockOrganizationFeatures({ storeknox: true });

      await openProjects();

      await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

      expect(await screen.findByText(akMT('switchTo'))).toBeInTheDocument();
    });

    it('leaves StoreKnox out of the list while a StoreKnox page is open', async () => {
      mockOrganizationFeatures({ storeknox: true });

      await renderAtRoute('/dashboard/storeknox/inventory/app-list');

      await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

      await screen.findByText(akMT('switchTo'));

      expect(screen.getByRole('link', { name: akMT('appknox') })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: akMT('storeknox.title') })).not.toBeInTheDocument();
    });

    it('calls StoreKnox app monitoring on an install that is not Appknox', async () => {
      mockOrganizationFeatures({ storeknox: true });

      await openProjects();

      await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

      expect(await screen.findByRole('link', { name: akMT('appMonitoring') })).toBeInTheDocument();
    });

    it('calls StoreKnox by name on an Appknox host, and still offers the security dashboard', async () => {
      vi.stubGlobal('location', { ...window.location, href: 'https://secure.appknox.com/' });

      mockOrganizationFeatures({ storeknox: true });
      mockOrganizationMe({ has_security_permission: true });

      await openProjects();

      await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

      expect(
        await screen.findByRole('link', { name: akMT('storeknox.title') })
      ).toBeInTheDocument();

      /* The security dashboard has no logo of its own, so it keeps its indicator. */
      expect(screen.getByRole('link', { name: akMT('securityDashboard') })).toBeInTheDocument();
    });

    it('links the security dashboard to /security/projects in a new tab, since it is its own app', async () => {
      mockOrganizationMe({ has_security_permission: true });

      await openProjects();

      await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

      const security = await screen.findByRole('link', { name: akMT('securityDashboard') });

      expect(security).toHaveAttribute('href', '/security/projects');
      expect(security).toHaveAttribute('target', '_blank');
      expect(security).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('closes the panel once a product is chosen', async () => {
      mockOrganizationFeatures({ storeknox: true });

      await openProjects();

      await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));

      await userEvent.click(await screen.findByRole('link', { name: akMT('appMonitoring') }));

      await waitFor(() => expect(screen.queryByText(akMT('switchTo'))).not.toBeInTheDocument());
    });

    it('leaves StoreKnox out for an organization entitled only to offensive security', async () => {
      mockOrganizationFeatures({ offensive_security: true });

      await openProjects();

      await userEvent.click(await screen.findByRole('button', { name: akMT('appSwitcher') }));
      await screen.findByText(akMT('switchTo'));

      expect(screen.queryByRole('link', { name: akMT('storeknox.title') })).not.toBeInTheDocument();
    });

    it('is not offered at all to an account with no product but Appknox', async () => {
      await openProjects();

      await screen.findByRole('link', { name: akMT('allProjects') });

      expect(screen.queryByRole('button', { name: akMT('appSwitcher') })).not.toBeInTheDocument();
    });
  });

  it('draws no rule above the items when no switcher stands above them', async () => {
    await openProjects();

    await screen.findByRole('link', { name: akMT('allProjects') });

    const nav = document.querySelector('nav');

    expect(nav?.previousElementSibling).not.toHaveAttribute('data-slot', 'divider');
  });

  it('rules off the items from the switcher when there is one', async () => {
    mockOrganizationFeatures({ storeknox: true });

    await openProjects();
    await screen.findByRole('button', { name: akMT('appSwitcher') });

    const nav = document.querySelector('nav');

    expect(nav?.previousElementSibling).toHaveAttribute('data-slot', 'divider');
  });

  describe('the rows below the navigation', () => {
    it('states the release this build is', async () => {
      await openProjects();

      const version = `${akMT('version')} - ${PRODUCT_VERSIONS.appknox}`;

      expect(await screen.findByRole('button', { name: version })).toBeInTheDocument();
    });

    it('takes a pointer on the release, which a product tour opens its guide from', async () => {
      await openProjects();

      const version = `${akMT('version')} - ${PRODUCT_VERSIONS.appknox}`;

      expect(await screen.findByRole('button', { name: version })).toHaveClass(
        'cursor-pointer',
        'hover:bg-hover-light'
      );
    });

    it('puts the chat away when another item in the navigation is pressed', async () => {
      const close = vi.fn();

      window.fcWidget = {
        open: vi.fn(),
        close,
        isOpen: vi.fn(() => true),
        destroy: vi.fn(),
        on: vi.fn(),
        user: { get: vi.fn(), create: vi.fn(), setProperties: vi.fn() },
      };

      await openProjects();
      await userEvent.click(await screen.findByRole('link', { name: akMT('allProjects') }));

      expect(close).toHaveBeenCalled();

      delete window.fcWidget;
    });

    it('tints the chat mark with the brand colour, as the rest of the row is not', async () => {
      mockFreshchatKey('a-freshchat-key');

      await openProjects();

      const chat = await screen.findByRole('button', { name: akMT('chatSupport') });

      expect(chat.querySelector('svg')).toHaveClass('text-primary');
    });

    it('offers chat support where the install carries a key for it', async () => {
      mockFreshchatKey('a-freshchat-key');

      await openProjects();

      expect(await screen.findByRole('button', { name: akMT('chatSupport') })).toBeInTheDocument();
    });

    it('offers no chat support on an install that carries no key', async () => {
      mockFreshchatKey('');

      await openProjects();
      await screen.findByRole('link', { name: akMT('allProjects') });

      expect(screen.queryByRole('button', { name: akMT('chatSupport') })).not.toBeInTheDocument();
    });
  });

  it('shows the partner clients in the same chrome as the dashboard', async () => {
    mockOrganizationMe({ can_access_partner_dashboard: true });

    await renderAtRoute('/partner/clients');

    expect(await screen.findByRole('link', { name: akMT('allProjects') })).toBeInTheDocument();
  });

  it('links to SCA with no search, since the route defaults the app offset', async () => {
    await openProjects();

    await waitFor(() =>
      expect(navItem(akMT('SBOM'))).toHaveAttribute('href', '/dashboard/sbom/apps')
    );
  });
});
