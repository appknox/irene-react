import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { configurationStore } from '@irene/api/stores/configuration';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';

import { buildServerConfiguration, buildSession } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';

const tab = (name: string) => screen.getByRole('tab', { name });

const tabNames = () => screen.getAllByRole('tab').map((element) => element.textContent);

describe('AccountSettingsLayout', () => {
  beforeEach(() => {
    storeSession(buildSession());
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
  });

  it('opens on the general tab when no tab is named in the URL', async () => {
    const { router } = await renderAtRoute('/dashboard/settings');

    expect(router.state.location.pathname).toBe('/dashboard/settings/general');

    expect(await screen.findByRole('tab', { name: akMT('general') })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('names the page above its tabs', async () => {
    await renderAtRoute('/dashboard/settings/general');

    expect(await screen.findByText(akMT('accountSettings'))).toBeInTheDocument();
  });

  it('leaves the CYOD tab out for an organization without the cyod feature', async () => {
    await renderAtRoute('/dashboard/settings/general');

    await screen.findByRole('tablist');

    expect(tabNames()).toEqual([
      akMT('general'),
      akMT('security'),
      akMT('developerSettings'),
      akMT('notificationPreferences'),
    ]);
  });

  it('offers the CYOD tab before notification preferences when the cyod feature is on', async () => {
    mockOrganizationFeatures({ cyod: true });

    await renderAtRoute('/dashboard/settings/general');

    await screen.findByRole('tablist');

    expect(tabNames()).toEqual([
      akMT('general'),
      akMT('security'),
      akMT('developerSettings'),
      akMT('cyod.settings.tabLabel'),
      akMT('notificationPreferences'),
    ]);
  });

  it('selects the tab for the page the URL names', async () => {
    await renderAtRoute('/dashboard/settings/developersettings');

    await screen.findByRole('tablist');

    expect(tab(akMT('developerSettings'))).toHaveAttribute('aria-selected', 'true');
    expect(tab(akMT('general'))).toHaveAttribute('aria-selected', 'false');
  });

  it('navigates to a tab’s page when the tab is pressed', async () => {
    const { router } = await renderAtRoute('/dashboard/settings/general');

    await userEvent.click(await screen.findByRole('tab', { name: akMT('security') }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard/settings/security')
    );

    expect(tab(akMT('security'))).toHaveAttribute('aria-selected', 'true');
  });

  it('still renders the CYOD page by URL while its tab is hidden, as irene does', async () => {
    await renderAtRoute('/dashboard/settings/cyod-settings');

    await screen.findByRole('tablist');

    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { selected: true })).not.toBeInTheDocument();
  });
});
