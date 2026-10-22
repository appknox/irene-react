import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configurationStore } from '@irene/api/stores/configuration';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import {
  getMarketplaceIntegrations,
  getMarketplacePlugins,
  type MarketplaceItem,
} from '@/features/marketplace/items';

import { buildServerConfiguration, buildSession } from '@tests/factories';
import { mockOrganizationMe } from '@tests/organization';
import { renderAtRoute } from '@tests/render';

const MARKETPLACE = '/dashboard/marketplace';

const card = (id: string) => {
  const element = document.querySelector<HTMLElement>(`[data-test-marketplace-card="${id}"]`);

  if (!element) {
    throw new Error(`No marketplace card ${id}`);
  }

  return element;
};

const findItem = (items: MarketplaceItem[], id: string) => {
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    throw new Error(`No marketplace item ${id}`);
  }

  return item;
};

const openMarketplace = async () => {
  const rendered = await renderAtRoute(MARKETPLACE);

  await screen.findByRole('heading', { level: 1, name: akMT('marketplace') });

  return rendered;
};

/** Opens a card's setup guide and hands back the drawer it opened. */
const openGuide = async (id: string) => {
  const user = userEvent.setup();

  await openMarketplace();
  await user.click(card(id));

  const drawer = await screen.findByRole('dialog');

  return { user, drawer };
};

describe('MarketplacePage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
    window.runtimeGlobalConfig = { IRENE_ENABLE_MARKETPLACE: 'true' };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the URL home on a deployment without the marketplace', async () => {
    window.runtimeGlobalConfig = { IRENE_ENABLE_MARKETPLACE: 'false' };

    const { router } = await renderAtRoute(MARKETPLACE);

    await waitFor(() => expect(router.state.location.pathname).not.toBe(MARKETPLACE));
  });

  it('lists every plugin and every integration under its own heading', async () => {
    await openMarketplace();

    const plugins = screen.getByRole('region', { name: akMT('plugins') });
    const integrations = screen.getByRole('region', { name: akMT('integration') });

    for (const item of getMarketplacePlugins()) {
      expect(within(plugins).getByText(item.title)).toBeInTheDocument();
    }

    for (const item of getMarketplaceIntegrations()) {
      expect(within(integrations).getByText(item.title)).toBeInTheDocument();
    }
  });

  it("opens a published plugin's own page in a new tab", async () => {
    await openMarketplace();

    for (const item of getMarketplacePlugins()) {
      if (item.kind === 'link') {
        expect(card(item.id)).toHaveAttribute('href', item.href);
        expect(card(item.id)).toHaveAttribute('target', '_blank');
        expect(card(item.id)).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  describe('setup guides', () => {
    it('opens the steps for a pipeline that runs the CLI', async () => {
      const item = findItem(getMarketplacePlugins(), 'circleci');
      const { drawer } = await openGuide(item.id);

      expect(within(drawer).getByText(akMT('integrateAppknoxToCICDPipeline'))).toBeInTheDocument();
      expect(within(drawer).getByText(item.title)).toBeInTheDocument();

      expect(within(drawer).getByRole('link', { name: 'Developer Settings' })).toHaveAttribute(
        'href',
        '/dashboard/settings/developersettings'
      );
    });

    it('copies a command from the steps', async () => {
      const { user, drawer } = await openGuide('gitlab');

      const [block] = drawer.querySelectorAll<HTMLElement>('[data-slot="code-block"]');

      await user.click(within(block).getByRole('button', { name: akMT('copy') }));

      expect(await navigator.clipboard.readText()).toBe(block.querySelector('code')?.textContent);
      expect(await screen.findByText(akMT('copiedToClipboard'))).toBeInTheDocument();
    });

    it('says so when the browser will not copy', async () => {
      const { user, drawer } = await openGuide('bitbucket');

      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

      await user.click(within(drawer).getAllByRole('button', { name: akMT('copy') })[0]);

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    });

    it('shows App Center its post-build script and both screenshots', async () => {
      const { drawer } = await openGuide('app-center');

      expect(within(drawer).getByText(/appcenter-post-build\.sh/)).toBeInTheDocument();
      expect(within(drawer).getByAltText('appcenter build config')).toBeInTheDocument();
      expect(within(drawer).getByAltText('appcenter environment config')).toBeInTheDocument();
    });

    it('shows Bitrise its script step', async () => {
      const { drawer } = await openGuide('bitrise');

      expect(within(drawer).getByText(/BITRISE_IPA_PATH/)).toBeInTheDocument();

      expect(
        within(drawer).getByAltText('bitrise workflow editor: script step')
      ).toBeInTheDocument();
    });

    it('opens ArmorCode under its own heading', async () => {
      const item = findItem(getMarketplaceIntegrations(), 'armorcode');
      const { drawer } = await openGuide(item.id);

      expect(within(drawer).getByText(akMT('integrationSteps'))).toBeInTheDocument();
      expect(within(drawer).getByText('Add Configuration')).toBeInTheDocument();
    });

    it('closes the steps from the close button', async () => {
      const { user, drawer } = await openGuide('circleci');

      await user.click(within(drawer).getByRole('button', { name: akMT('close') }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });

  describe('integrations', () => {
    const connected = () =>
      getMarketplaceIntegrations().filter((item) => item.kind === 'integration');

    it("takes an admin to the organization's integration settings", async () => {
      mockOrganizationMe({ is_admin: true });

      const user = userEvent.setup();
      const { router } = await openMarketplace();
      const [first] = connected();

      for (const item of connected()) {
        expect(card(item.id)).toHaveAttribute(
          'href',
          '/dashboard/organization/settings/integrations'
        );
      }

      await user.click(card(first.id));

      await waitFor(() =>
        expect(router.state.location.pathname).toBe('/dashboard/organization/settings/integrations')
      );
    });

    it('tells anyone else they may not add integrations', async () => {
      mockOrganizationMe({ is_admin: false });

      const user = userEvent.setup();
      const { router } = await openMarketplace();
      const [first] = connected();

      await user.click(card(first.id));

      expect(await screen.findByText(akMT('integrationsPermissionDenied'))).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(MARKETPLACE);
    });
  });
});
