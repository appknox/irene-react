import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization';
import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';

import { buildPendingSkApp, buildSkApp, buildSkOrganizationUser } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';
import { mockSkAppLists, mockStoreknoxOrganization, signInToStoreknox } from '@tests/storeknox';

const PENDING = '/dashboard/storeknox/inventory/pending-reviews';

describe('the pending reviews', () => {
  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
  });

  it('lists the apps waiting for a decision, active and pending approval', async () => {
    const app = buildPendingSkApp({ app_source: ENUMS.SK_DISCOVERY.AUTO });
    const received = mockSkAppLists({ pending: [app] });

    await renderAtRoute(PENDING);

    const row = (await screen.findByText(app.app_metadata.title)).closest('tr') as HTMLElement;

    expect(within(row).getByText(akMT('system'))).toBeInTheDocument();

    const pendingRequest = received.find(
      (params) =>
        params.get('approval_status') === String(ENUMS.SK_APPROVAL_STATUS.PENDING_APPROVAL)
    );

    expect(pendingRequest?.get('app_status')).toBe(String(ENUMS.SK_APP_STATUS.ACTIVE));
  });

  it('keeps the archive out of reach and the package name plain, since neither belongs to a review', async () => {
    const app = buildPendingSkApp();

    mockSkAppLists({ pending: [app] });

    await renderAtRoute(PENDING);

    expect((await screen.findByText(app.app_metadata.package_name)).closest('a')).toBeNull();

    expect(
      screen.queryByRole('link', { name: akMT('storeknox.archivedApps') })
    ).not.toBeInTheDocument();
  });

  it('names the member who searched for an app', async () => {
    const requester = buildSkOrganizationUser();

    const app = buildPendingSkApp({
      app_source: ENUMS.SK_DISCOVERY.MANUAL,
      added_by: requester.id,
    });

    mockSkAppLists({ pending: [app] });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.user('*', requester.id)), () =>
        HttpResponse.json(requester)
      )
    );

    await renderAtRoute(PENDING);

    expect(await screen.findByText(requester.email)).toBeInTheDocument();
  });

  it('approves an app and says it joined the inventory', async () => {
    const app = buildPendingSkApp();
    let body: unknown;

    mockSkAppLists({ pending: [app] });

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.approvalStatus(app.id)), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({ id: app.id });
      })
    );

    await renderAtRoute(PENDING);

    await userEvent.click(await screen.findByRole('button', { name: akMT('approve') }));

    expect(
      await screen.findByText(
        akMT('storeknox.appAddedToInventory', { appName: app.app_metadata.title })
      )
    ).toBeInTheDocument();

    expect(body).toEqual({ approval_status: ENUMS.SK_APPROVAL_STATUS.APPROVED });
  });

  it('rejects an app and says so', async () => {
    const app = buildPendingSkApp();

    mockSkAppLists({ pending: [app] });

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.approvalStatus(app.id)), () =>
        HttpResponse.json({ id: app.id })
      )
    );

    await renderAtRoute(PENDING);

    await userEvent.click(await screen.findByRole('button', { name: akMT('reject') }));

    expect(
      await screen.findByText(akMT('storeknox.appRejected', { appName: app.app_metadata.title }))
    ).toBeInTheDocument();
  });

  it('shows the server’s reason when a decision fails', async () => {
    const app = buildPendingSkApp();
    const reason = 'App already in inventory';

    mockSkAppLists({ pending: [app] });

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.approvalStatus(app.id)), () =>
        HttpResponse.json({ detail: reason }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(PENDING);

    await userEvent.click(await screen.findByRole('button', { name: akMT('approve') }));

    expect(await screen.findByText(reason)).toBeInTheDocument();
  });

  it('reads the inventory’s count from its first page while the pending list is paged', async () => {
    const received = mockSkAppLists({
      pending: [buildPendingSkApp()],
      inventory: [buildSkApp()],
    });

    const { router } = await renderAtRoute(`${PENDING}?app_limit=10&app_offset=10`);

    await screen.findByRole('tab', { name: `${akMT('storeknox.appInventory')}1` });

    await router.navigate({ to: PENDING, search: { app_limit: 10, app_offset: 20 } });

    await waitFor(() =>
      expect(received.some((params) => params.get('offset') === '20')).toBe(true)
    );

    const inventoryOffsets = received
      .filter(
        (params) =>
          params.get('approval_status') === String(ENUMS.SK_APPROVAL_STATUS.APPROVED) &&
          params.get('app_status') !== String(ENUMS.SK_APP_STATUS.ARCHIVED)
      )
      .map((params) => params.get('offset'));

    expect(inventoryOffsets).toEqual(['0']);
  });

  it('says there is nothing pending', async () => {
    mockSkAppLists({ pending: [] });

    await renderAtRoute(PENDING);

    expect(await screen.findByText(akMT('storeknox.noPendingItems'))).toBeInTheDocument();
  });
});

describe('the pending reviews for anyone but an owner', () => {
  it('sends them to the inventory', async () => {
    signInToStoreknox({ is_admin: true });
    mockStoreknoxOrganization();
    mockSkAppLists();

    const { router } = await renderAtRoute(PENDING);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard/storeknox/inventory/app-list')
    );
  });
});

describe('the pending reviews when the list will not load', () => {
  it('shows the server’s reason', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.apps()), () =>
        HttpResponse.json(
          { detail: 'Pending list unavailable' },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    await renderAtRoute(PENDING);

    expect((await screen.findAllByText('Pending list unavailable')).length).toBeGreaterThan(0);
  });
});

describe('a decision in flight', () => {
  it('stands a spinner in for the buttons', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const app = buildPendingSkApp();

    mockSkAppLists({ pending: [app] });

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.approvalStatus(app.id)), async () => {
        await delay('infinite');

        return HttpResponse.json({});
      })
    );

    await renderAtRoute(PENDING);

    await userEvent.click(await screen.findByRole('button', { name: akMT('approve') }));

    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('reject') })).not.toBeInTheDocument();
  });

  it('keeps the spinner after the decision is saved, until the lists come back without the app', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const app = buildPendingSkApp();

    mockSkAppLists({ pending: [app] });

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.approvalStatus(app.id)), () =>
        HttpResponse.json({ id: app.id })
      )
    );

    await renderAtRoute(PENDING);

    const approve = await screen.findByRole('button', { name: akMT('approve') });

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.apps()), async () => {
        await delay('infinite');

        return HttpResponse.json({});
      })
    );

    await userEvent.click(approve);

    expect(
      await screen.findByText(
        akMT('storeknox.appAddedToInventory', { appName: app.app_metadata.title })
      )
    ).toBeInTheDocument();

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('approve') })).not.toBeInTheDocument();
  });
});
