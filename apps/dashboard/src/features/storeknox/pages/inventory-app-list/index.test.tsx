import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization';
import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';

import {
  buildPendingSkApp,
  buildSkApp,
  buildSkAppMetadata,
  buildSkInventoryApp,
  buildSkSubscription,
} from '@tests/factories';

import {
  mockSkAppLists,
  mockSkInventoryApp,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const APP_LIST = '/dashboard/storeknox/inventory/app-list';

describe('the inventory', () => {
  beforeEach(() => {
    signInToStoreknox();
    mockStoreknoxOrganization();
  });

  it('lists the approved apps that are active or gone from their store', async () => {
    const apps = [buildSkApp(), buildSkApp()];
    const received = mockSkAppLists({ inventory: apps });

    await renderAtRoute(APP_LIST);

    expect(await screen.findByText(apps[0].app_metadata.title)).toBeInTheDocument();
    expect(screen.getByText(apps[1].app_metadata.package_name)).toBeInTheDocument();
    expect(screen.getByText(apps[0].app_metadata.dev_name)).toBeInTheDocument();

    const inventoryRequest = received.find(
      (params) => params.get('approval_status') === String(ENUMS.SK_APPROVAL_STATUS.APPROVED)
    );

    expect(inventoryRequest?.get('app_status')).toBe(
      `${ENUMS.SK_APP_STATUS.ACTIVE},${ENUMS.SK_APP_STATUS.DECOMMISSIONED}`
    );

    expect(inventoryRequest?.has('monitoring_status')).toBe(false);
  });

  it('counts the inventory on its tab', async () => {
    const apps = [buildSkApp()];

    mockSkAppLists({ inventory: apps, inventoryCount: 14 });

    await renderAtRoute(APP_LIST);

    expect(
      await screen.findByRole('tab', { name: `${akMT('storeknox.appInventory')}14` })
    ).toBeInTheDocument();
  });

  it('says so when the inventory is empty', async () => {
    mockSkAppLists({ inventory: [] });

    await renderAtRoute(APP_LIST);

    expect(await screen.findByText(akMT('storeknox.noInventoryAppsFound'))).toBeInTheDocument();
  });

  it('reads each app’s monitoring status', async () => {
    const disabled = buildSkApp({ monitoring_enabled: false });

    mockSkAppLists({ inventory: [disabled] });

    await renderAtRoute(APP_LIST);

    const row = (await screen.findByText(disabled.app_metadata.title)).closest('tr');

    expect(within(row as HTMLElement).getByText(akMT('disabled'))).toBeInTheDocument();
  });

  it('filters by monitoring status, and clears the filter', async () => {
    const app = buildSkApp();
    const received = mockSkAppLists({ inventory: [app] });
    const { router } = await renderAtRoute(APP_LIST);

    await screen.findByText(app.app_metadata.title);
    await userEvent.click(screen.getByRole('button', { name: akMT('storeknox.monitoringStatus') }));
    await userEvent.click(screen.getByRole('radio', { name: akMT('storeknox.needsAction') }));

    await waitFor(() =>
      expect(received.at(-1)?.get('monitoring_status')).toBe(
        String(ENUMS.SK_APP_MONITORING_STATUS_FILTER.ACTION_NEEDED)
      )
    );

    expect(router.state.location.search).toMatchObject({ app_offset: 0 });

    await userEvent.click(screen.getByRole('button', { name: akMT('storeknox.monitoringStatus') }));
    await userEvent.click(screen.getByRole('button', { name: akMT('clearFilter') }));

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ monitoring_status: -1 })
    );
  });

  it('says no app matches a filter that leaves the list empty', async () => {
    mockSkAppLists({ inventory: [] });

    await renderAtRoute(
      `${APP_LIST}?monitoring_status=${ENUMS.SK_APP_MONITORING_STATUS_FILTER.DISABLED}`
    );

    expect(
      await screen.findByText(akMT('storeknox.noAppMatchesYourCurrentFilter'))
    ).toBeInTheDocument();
  });

  it('turns to the next page from the end of this one', async () => {
    const received = mockSkAppLists({ inventory: [buildSkApp()], inventoryCount: 30 });

    await renderAtRoute(APP_LIST);

    await userEvent.click(await screen.findByRole('button', { name: akMT('next') }));

    await waitFor(() => expect(received.at(-1)?.get('offset')).toBe('10'));
  });

  it('keeps the page on screen, marked busy, while the next one loads', async () => {
    const app = buildSkApp();

    mockSkAppLists({ inventory: [app], inventoryCount: 30 });

    await renderAtRoute(APP_LIST);

    await screen.findByText(app.app_metadata.title);

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.apps()), async () => {
        await delay('infinite');

        return HttpResponse.json({});
      })
    );

    await userEvent.click(screen.getByRole('button', { name: akMT('next') }));

    await waitFor(() => expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true'));

    expect(screen.getByText(app.app_metadata.title)).toBeInTheDocument();
  });

  it('links each app’s package name to its details, for the keyboard and a new tab', async () => {
    const app = buildSkApp();

    mockSkAppLists({ inventory: [app] });

    await renderAtRoute(APP_LIST);

    expect((await screen.findByText(app.app_metadata.package_name)).closest('a')).toHaveAttribute(
      'href',
      `/dashboard/storeknox/inventory-details/${app.id}`
    );
  });

  it('opens an app’s details from anywhere on its row', async () => {
    const app = buildSkInventoryApp();

    mockSkAppLists({ inventory: [app] });
    mockSkInventoryApp(app);

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.subscription('*')), () =>
        HttpResponse.json(buildSkSubscription())
      )
    );

    const { router } = await renderAtRoute(APP_LIST);

    await userEvent.click(await screen.findByText(app.app_metadata.dev_name));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `/dashboard/storeknox/inventory-details/${app.id}`
      )
    );
  });

  it('keeps the archive and the settings from a member', async () => {
    mockSkAppLists({ inventory: [buildSkApp()] });

    await renderAtRoute(APP_LIST);

    await screen.findByRole('tab', { name: akMT('storeknox.appInventory') });

    expect(
      screen.queryByRole('link', { name: akMT('storeknox.archivedApps') })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: akMT('storeknox.inventorySettings') })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('tab', { name: akMT('storeknox.pendingReview') })
    ).not.toBeInTheDocument();
  });

  it('leaves a rate-limited inventory to the global notice', async () => {
    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.apps()), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS })
      )
    );

    await renderAtRoute(APP_LIST);

    await screen.findByRole('tab', { name: akMT('storeknox.appInventory') });

    await waitFor(() =>
      expect(screen.queryByText(akMT('storeknox.inventoryLoadFailed'))).not.toBeInTheDocument()
    );
  });

  it('raises irene’s message when the inventory will not load', async () => {
    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.apps()), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(APP_LIST);

    expect(await screen.findByText(akMT('storeknox.inventoryLoadFailed'))).toBeInTheDocument();
  });
});

describe('the inventory for an owner', () => {
  beforeEach(() => signInToStoreknox({ is_owner: true }));

  it('counts the apps waiting for review and leads to the archive', async () => {
    mockStoreknoxOrganization();

    mockSkAppLists({
      inventory: [buildSkApp()],
      pending: [buildPendingSkApp(), buildPendingSkApp()],
    });

    await renderAtRoute(APP_LIST);

    expect(
      await screen.findByRole('tab', { name: `${akMT('storeknox.pendingReview')}2` })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: akMT('storeknox.archivedApps') })).toHaveAttribute(
      'href',
      '/dashboard/storeknox/inventory/archived-apps'
    );
  });

  it('switches auto-discovery from the settings', async () => {
    const organization = mockStoreknoxOrganization({ auto_discovery_enabled: false });
    let body: unknown;

    mockSkAppLists({ inventory: [buildSkApp()] });

    server.use(
      http.patch(
        buildAPITestURL(StoreknoxEndpoints.organization(organization.id)),
        async ({ request }) => {
          body = await request.json();

          return HttpResponse.json({ ...organization, auto_discovery_enabled: true });
        }
      )
    );

    await renderAtRoute(APP_LIST);

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.inventorySettings') })
    );

    await userEvent.click(screen.getByRole('switch', { name: akMT('storeknox.autoDiscovery') }));

    expect(
      await screen.findByText(akMT('storeknox.statusToggleSuccessMessage'))
    ).toBeInTheDocument();

    expect(body).toEqual({ auto_discovery_enabled: true });
    expect(screen.getByRole('switch', { name: akMT('storeknox.autoDiscovery') })).toBeChecked();
  });
});

describe('the StoreKnox guard', () => {
  it('sends an organization without StoreKnox to its projects', async () => {
    signInToStoreknox();
    mockOrganizationFeatures({ storeknox: false });

    const { router } = await renderAtRoute(APP_LIST);

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/projects'));
  });
});

describe('the inventory’s cells and settings', () => {
  it('marks an App Store app, an app with no email, and an app with no icon', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();

    const app = buildSkApp({
      app_metadata: buildSkAppMetadata({
        platform: ENUMS.PLATFORM.IOS,
        dev_email: '',
        icon_url: '',
      }),
    });

    mockSkAppLists({ inventory: [app] });

    await renderAtRoute(APP_LIST);

    const row = (await screen.findByText(app.app_metadata.title)).closest('tr') as HTMLElement;

    expect(within(row).getByLabelText('App Store')).toBeInTheDocument();
    expect(within(row).getByText(akMT('noDataAvailable'))).toBeInTheDocument();

    expect(row.querySelector('[data-test-sk-app-icon-fallback]')).toHaveTextContent(
      app.app_metadata.title.charAt(0)
    );
  });

  it('adds Appknox projects by default from the settings, and says why when it fails', async () => {
    signInToStoreknox({ is_owner: true });

    const organization = mockStoreknoxOrganization({
      add_appknox_project_to_inventory_by_default: false,
    });

    const reason = 'Setting is locked';

    mockSkAppLists({ inventory: [buildSkApp()] });

    server.use(
      http.patch(buildAPITestURL(StoreknoxEndpoints.organization(organization.id)), () =>
        HttpResponse.json({ detail: reason }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(APP_LIST);

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.inventorySettings') })
    );

    await userEvent.click(
      screen.getByRole('switch', { name: akMT('storeknox.addAppknoxProjectsByDefault') })
    );

    expect(await screen.findByText(reason)).toBeInTheDocument();
  });
});

describe('the inventory settings while they cannot be saved', () => {
  it('holds both toggles while a save is in flight, so a second flip cannot race it', async () => {
    signInToStoreknox({ is_owner: true });

    const organization = mockStoreknoxOrganization({ auto_discovery_enabled: false });
    let saves = 0;

    mockSkAppLists({ inventory: [buildSkApp()] });

    server.use(
      http.patch(buildAPITestURL(StoreknoxEndpoints.organization(organization.id)), async () => {
        saves += 1;
        await delay('infinite');

        return HttpResponse.json(organization);
      })
    );

    await renderAtRoute(APP_LIST);

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.inventorySettings') })
    );

    const autoDiscovery = screen.getByRole('switch', { name: akMT('storeknox.autoDiscovery') });

    await userEvent.click(autoDiscovery);

    await waitFor(() => expect(autoDiscovery).toBeDisabled());

    expect(
      screen.getByRole('switch', { name: akMT('storeknox.addAppknoxProjectsByDefault') })
    ).toBeDisabled();

    await userEvent.click(autoDiscovery);

    expect(saves).toBe(1);
  });

  it('holds both toggles when there is no StoreKnox organization to save them to', async () => {
    signInToStoreknox({ is_owner: true });
    mockSkAppLists({ inventory: [buildSkApp()] });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.storeknoxOrganization()), () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      )
    );

    await renderAtRoute(APP_LIST);

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('storeknox.inventorySettings') })
    );

    expect(screen.getByRole('switch', { name: akMT('storeknox.autoDiscovery') })).toBeDisabled();

    expect(
      screen.getByRole('switch', { name: akMT('storeknox.addAppknoxProjectsByDefault') })
    ).toBeDisabled();
  });
});
