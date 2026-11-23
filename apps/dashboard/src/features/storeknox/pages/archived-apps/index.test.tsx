import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';

import {
  mockSkAppLists,
  mockSkInventoryApp,
  mockSkSubscription,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { buildArchivedSkApp, buildSkInventoryApp } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const ARCHIVED = '/dashboard/storeknox/inventory/archived-apps';

describe('the archived apps', () => {
  it('lists who archived each app and when, under a trail back to the inventory', async () => {
    signInToStoreknox({ is_admin: true });
    mockStoreknoxOrganization();

    const app = buildArchivedSkApp();

    mockSkAppLists({ archived: [app] });

    await renderAtRoute(ARCHIVED);

    expect(await screen.findByText(app.app_metadata.title)).toBeInTheDocument();
    expect(screen.getByText(app.archived_by ?? '')).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(app.archived_on, 'longDate'))).toBeInTheDocument();

    expect(screen.getByRole('link', { name: akMT('storeknox.appInventory') })).toHaveAttribute(
      'href',
      '/dashboard/storeknox/inventory/app-list'
    );
  });

  it('restores an app whose lock period has passed', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const app = buildArchivedSkApp({
      unarchive_available_on: dayjs().subtract(1, 'day').toISOString(),
    });

    let body: unknown;

    mockSkAppLists({ archived: [app] });

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.appStatus(app.id)), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({});
      })
    );

    await renderAtRoute(ARCHIVED);

    await userEvent.click(await screen.findByRole('button', { name: akMT('storeknox.unarchive') }));

    await waitFor(() => expect(body).toEqual({ app_status: ENUMS.SK_APP_STATUS.ACTIVE }));
  });

  it('shows the restore in progress until the server answers', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const app = buildArchivedSkApp({
      unarchive_available_on: dayjs().subtract(1, 'day').toISOString(),
    });

    mockSkAppLists({ archived: [app] });

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.appStatus(app.id)), async () => {
        await delay('infinite');

        return HttpResponse.json({});
      })
    );

    await renderAtRoute(ARCHIVED);

    await userEvent.click(await screen.findByRole('button', { name: akMT('storeknox.unarchive') }));

    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('holds back an app still in its lock period', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const app = buildArchivedSkApp({
      unarchive_available_on: dayjs().add(3, 'month').toISOString(),
    });

    mockSkAppLists({ archived: [app] });

    await renderAtRoute(ARCHIVED);

    expect(await screen.findByRole('button', { name: akMT('storeknox.unarchive') })).toBeDisabled();
  });

  it('says there are no archived apps', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
    mockSkAppLists({ archived: [] });

    await renderAtRoute(ARCHIVED);

    expect(await screen.findByText(akMT('storeknox.noArchivedAppsFound'))).toBeInTheDocument();
  });

  it('sends a member to the inventory', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();
    mockSkAppLists();

    const { router } = await renderAtRoute(ARCHIVED);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard/storeknox/inventory')
    );
  });
});

describe('an archived app’s row', () => {
  it('opens the app’s details', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
    mockSkSubscription();

    const app = buildSkInventoryApp({
      app_status: ENUMS.SK_APP_STATUS.ARCHIVED,
      archived_on: dayjs().subtract(1, 'month').toISOString(),
      archived_by: null,
    });

    mockSkAppLists({ archived: [app] });
    mockSkInventoryApp(app);

    const { router } = await renderAtRoute(ARCHIVED);

    await userEvent.click(await screen.findByText(app.app_metadata.package_name));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `/dashboard/storeknox/inventory-details/${app.id}`
      )
    );
  });
});

describe('a restore that fails', () => {
  it('says why', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const app = buildArchivedSkApp({
      unarchive_available_on: dayjs().subtract(1, 'day').toISOString(),
    });

    const reason = 'Inventory is full';

    mockSkAppLists({ archived: [app] });

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.appStatus(app.id)), () =>
        HttpResponse.json({ detail: reason }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(ARCHIVED);

    await userEvent.click(await screen.findByRole('button', { name: akMT('storeknox.unarchive') }));

    expect(await screen.findByText(reason)).toBeInTheDocument();
  });
});
