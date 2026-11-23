import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';

import {
  mockSkInventoryApp,
  mockSkSubscription,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { storeknoxKeys } from '@/features/storeknox/queries/inventory';
import { buildSkInventoryApp, buildSkSubscription } from '@tests/factories';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

import { CREDIT_REQUEST_STORAGE_KEY } from './components/toggle-monitoring-drawer';

const detailsOf = (id: number) => `/dashboard/storeknox/inventory-details/${id}`;

/** Answers the monitoring endpoint, keeping what it was sent, and the app's reload. */
function mockMonitoringToggle(app: ReturnType<typeof buildSkInventoryApp>) {
  const seen: { body?: unknown } = {};

  server.use(
    http.put(buildAPITestURL(StoreknoxEndpoints.monitoringStatus(app.id)), async ({ request }) => {
      seen.body = await request.json();

      return HttpResponse.json({ id: app.id });
    })
  );

  return seen;
}

describe('an app’s details', () => {
  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
    mockSkSubscription();
  });

  it('heads the page with the app, its developer and a trail back to the inventory', async () => {
    const app = buildSkInventoryApp();

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByText(app.app_metadata.title)).toBeInTheDocument();
    expect(screen.getAllByText(app.app_metadata.dev_name).length).toBeGreaterThan(0);

    expect(
      screen.getByText(`${akMT('storeknox.inventoryDetails')} (${app.app_metadata.package_name})`)
    ).toHaveAttribute('aria-current', 'page');

    expect(screen.getByText(akMT('storeknox.appNotPartOfAppknox'))).toBeInTheDocument();
  });

  it('keeps Inventory marked as the current page in the navigation', async () => {
    const app = buildSkInventoryApp();

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await screen.findByText(app.app_metadata.title);

    expect(screen.getByRole('link', { name: akMT('inventory') })).toHaveAttribute(
      'aria-current',
      'page'
    );

    expect(screen.getByRole('link', { name: akMT('discovery') })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('opens at the top however far the page before it was scrolled', async () => {
    const app = buildSkInventoryApp();
    const setScrollTop = vi.spyOn(Element.prototype, 'scrollTop', 'set');

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await screen.findByText(app.app_metadata.title);

    expect(setScrollTop).toHaveBeenCalledWith(0);
  });

  it('warns that an archived app is not being watched, with when it can be restored', async () => {
    const app = buildSkInventoryApp({
      app_status: ENUMS.SK_APP_STATUS.ARCHIVED,
      archived_on: dayjs().subtract(1, 'month').toISOString(),
      unarchive_available_on: dayjs().add(5, 'month').toISOString(),
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByRole('status')).toHaveTextContent(
      formatDateTime(app.unarchive_available_on, 'mediumDate')
    );
  });

  it('turns monitoring off straight away for a licensed app', async () => {
    const app = buildSkInventoryApp({ license_allocated: 1 });

    mockSkInventoryApp(app);

    const seen = mockMonitoringToggle(app);

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(
      await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') })
    );

    expect(
      await screen.findByText(`${akMT('storeknox.monitoring')} ${akMT('disabled')}`)
    ).toBeInTheDocument();

    expect(seen.body).toEqual({ monitoring_enabled: false });
  });

  it('asks before spending a licence on an unlicensed app', async () => {
    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });
    const subscription = mockSkSubscription({ licenses_remaining: 3 });

    mockSkInventoryApp(app);

    const seen = mockMonitoringToggle(app);

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(
      await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') })
    );

    expect(await screen.findByRole('dialog')).toHaveTextContent(
      String(subscription.licenses_remaining)
    );

    await userEvent.click(
      screen.getByRole('button', { name: `${akMT('yes')}, ${akMT('turnOn')}` })
    );

    await waitFor(() => expect(seen.body).toEqual({ monitoring_enabled: true }));
  });

  it('puts the switch back when the licence is not spent', async () => {
    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });

    mockSkSubscription({ licenses_remaining: 3 });
    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    const toggle = await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') });

    await userEvent.click(toggle);
    await userEvent.click(await screen.findByRole('button', { name: akMT('cancel') }));

    await waitFor(() => expect(toggle).not.toBeChecked());
  });

  it('offers to ask support when no licences are left, and remembers having asked', async () => {
    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });
    let requested = false;

    window.localStorage.removeItem(CREDIT_REQUEST_STORAGE_KEY);
    mockSkSubscription({ licenses_remaining: 0 });
    mockSkInventoryApp(app);

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.creditRequest()), () => {
        requested = true;

        return HttpResponse.json({});
      })
    );

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(
      await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') })
    );

    await userEvent.click(await screen.findByRole('button', { name: akMT('contactSupport') }));

    expect(await screen.findByText(akMT('storeknox.creditRequestSuccess'))).toBeInTheDocument();
    expect(requested).toBe(true);
    expect(window.localStorage.getItem(CREDIT_REQUEST_STORAGE_KEY)).toBe('true');
  });

  it('archives an app after confirming the lock period', async () => {
    const app = buildSkInventoryApp();
    let body: unknown;

    mockSkInventoryApp(app);

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.appStatus(app.id)), async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({});
      })
    );

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(await screen.findByRole('button', { name: akMT('storeknox.archive') }));

    await userEvent.click(
      await screen.findByRole('button', { name: `${akMT('yes')}, ${akMT('storeknox.archive')}` })
    );

    expect(await screen.findByText(akMT('storeknox.appArchivedSuccessfully'))).toBeInTheDocument();
    expect(body).toEqual({ app_status: ENUMS.SK_APP_STATUS.ARCHIVED });
  });

  it('offers no archive for an app gone from its store', async () => {
    const app = buildSkInventoryApp({ app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await screen.findByText(app.app_metadata.title);

    expect(
      screen.queryByRole('button', { name: akMT('storeknox.archive') })
    ).not.toBeInTheDocument();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('an app’s details for a member', () => {
  it('holds the monitoring switch and the archive back', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization();
    mockSkSubscription();

    const app = buildSkInventoryApp();

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(
      await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') })
    ).toBeDisabled();

    expect(
      screen.queryByRole('button', { name: akMT('storeknox.archive') })
    ).not.toBeInTheDocument();
  });
});

describe('an app’s details when things go wrong', () => {
  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
    mockSkSubscription();
  });

  it('puts the switch back and says why when monitoring will not change', async () => {
    const app = buildSkInventoryApp({ license_allocated: 1 });
    const reason = 'Monitoring is locked for this app';

    mockSkInventoryApp(app);

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.monitoringStatus(app.id)), () =>
        HttpResponse.json({ detail: reason }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(detailsOf(app.id));

    const toggle = await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') });

    await userEvent.click(toggle);

    expect(await screen.findByText(reason)).toBeInTheDocument();
    await waitFor(() => expect(toggle).toBeChecked());
  });

  it('still asks support when the browser keeps no storage', async () => {
    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });

    mockSkSubscription({ licenses_remaining: 0 });
    mockSkInventoryApp(app);

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.creditRequest()), () => HttpResponse.json({}))
    );

    const { getItem, setItem } = Storage.prototype;

    /* Only the credit request's key fails, so the stored session still signs the account in. */
    const blockCreditKey = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
      this: Storage,
      key: string
    ) {
      if (key === CREDIT_REQUEST_STORAGE_KEY) {
        throw new Error('storage disabled');
      }

      return getItem.call(this, key);
    });

    const blockCreditWrite = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string
    ) {
      if (key === CREDIT_REQUEST_STORAGE_KEY) {
        throw new Error('storage disabled');
      }

      setItem.call(this, key, value);
    });

    try {
      await renderAtRoute(detailsOf(app.id));

      await userEvent.click(
        await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') })
      );

      await userEvent.click(await screen.findByRole('button', { name: akMT('contactSupport') }));

      expect(await screen.findByText(akMT('storeknox.creditRequestSuccess'))).toBeInTheDocument();
    } finally {
      blockCreditKey.mockRestore();
      blockCreditWrite.mockRestore();
    }
  });

  it('forgets an old support request once licences are back', async () => {
    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });

    window.localStorage.setItem(CREDIT_REQUEST_STORAGE_KEY, 'true');
    mockSkSubscription({ licenses_remaining: 2 });
    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(
      await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') })
    );

    expect(
      await screen.findByRole('button', { name: `${akMT('yes')}, ${akMT('turnOn')}` })
    ).toBeInTheDocument();

    expect(window.localStorage.getItem(CREDIT_REQUEST_STORAGE_KEY)).toBeNull();
  });

  it('restores an archived app whose lock period has passed', async () => {
    const app = buildSkInventoryApp({
      app_status: ENUMS.SK_APP_STATUS.ARCHIVED,
      archived_on: dayjs().subtract(7, 'month').toISOString(),
      unarchive_available_on: dayjs().subtract(1, 'month').toISOString(),
    });

    mockSkInventoryApp(app);

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.appStatus(app.id)), () => HttpResponse.json({}))
    );

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(await screen.findByRole('button', { name: akMT('storeknox.unarchive') }));

    await userEvent.click(
      await screen.findByRole('button', { name: `${akMT('yes')}, ${akMT('storeknox.unarchive')}` })
    );

    expect(
      await screen.findByText(akMT('storeknox.appUnarchivedSuccessfully'))
    ).toBeInTheDocument();
  });

  it('says why archiving failed and keeps the drawer open', async () => {
    const app = buildSkInventoryApp();
    const reason = 'Archive limit reached';

    mockSkInventoryApp(app);

    server.use(
      http.put(buildAPITestURL(StoreknoxEndpoints.appStatus(app.id)), () =>
        HttpResponse.json({ detail: reason }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(await screen.findByRole('button', { name: akMT('storeknox.archive') }));

    await userEvent.click(
      await screen.findByRole('button', { name: `${akMT('yes')}, ${akMT('storeknox.archive')}` })
    );

    expect(await screen.findByText(reason)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: akMT('cancel') }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('warns that a decommissioned app has gone, with the date it went', async () => {
    const decommissionedOn = dayjs().subtract(2, 'week').toISOString();

    const app = buildSkInventoryApp({
      app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED,
      decommissioned_on: decommissionedOn,
    });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    expect(await screen.findByRole('status')).toHaveTextContent(
      formatDateTime(decommissionedOn, 'mediumDate')
    );
  });
});

describe('the monitoring switch for a trial or ended subscription', () => {
  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
  });

  it('turns an unlicensed app on straight away during a trial', async () => {
    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });

    mockSkSubscription({ is_trial: true });
    mockSkInventoryApp(app);

    const seen = mockMonitoringToggle(app);

    await renderAtRoute(detailsOf(app.id));

    const toggle = await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') });

    await waitFor(() => expect(toggle).toBeEnabled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    await userEvent.click(toggle);

    await waitFor(() => expect(seen.body).toEqual({ monitoring_enabled: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('turns an unlicensed app on straight away once the subscription has ended', async () => {
    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });

    mockSkSubscription({ end_date: dayjs().subtract(1, 'day').toISOString() });
    mockSkInventoryApp(app);

    const seen = mockMonitoringToggle(app);

    await renderAtRoute(detailsOf(app.id));

    await screen.findByText(app.app_metadata.title);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await userEvent.click(screen.getByRole('switch', { name: akMT('storeknox.monitoringAction') }));

    await waitFor(() => expect(seen.body).toEqual({ monitoring_enabled: true }));
  });

  it('waits on the licence count when the subscription will not load', async () => {
    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.subscription('*')), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(
      await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') })
    );

    const dialog = await screen.findByRole('dialog');

    /* The message carries markup, so it is compared as the text it renders to. */
    const note = render(<>{akMT('storeknox.licenseAllocationNote', { availableLicenses: 0 })}</>);

    await waitFor(() => expect(dialog).toHaveTextContent(note.container.textContent));
  });
});

describe('a support request that fails', () => {
  it('asks to try again and keeps the offer open', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();

    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });

    window.localStorage.removeItem(CREDIT_REQUEST_STORAGE_KEY);
    mockSkSubscription({ licenses_remaining: 0 });
    mockSkInventoryApp(app);

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.creditRequest()), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(detailsOf(app.id));

    await userEvent.click(
      await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') })
    );

    await userEvent.click(await screen.findByRole('button', { name: akMT('contactSupport') }));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('contactSupport') })).toBeInTheDocument();
  });
});

describe('the licence drawer across openings', () => {
  beforeEach(() => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
  });

  it('opens again after being cancelled, re-reading the licences left each time', async () => {
    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });
    const subscription = buildSkSubscription({ licenses_remaining: 3 });
    let reads = 0;

    mockSkInventoryApp(app);

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.subscription('*')), () => {
        reads += 1;

        return HttpResponse.json(subscription);
      })
    );

    await renderAtRoute(detailsOf(app.id));

    const toggle = await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') });

    await waitFor(() => expect(reads).toBeGreaterThan(0));

    const readsBeforeOpening = reads;

    await userEvent.click(toggle);
    await userEvent.click(await screen.findByRole('button', { name: akMT('cancel') }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(toggle);

    expect(await screen.findByRole('dialog')).toHaveTextContent(
      String(subscription.licenses_remaining)
    );

    await waitFor(() => expect(reads).toBe(readsBeforeOpening + 2));
  });

  it('marks the inventory lists stale once monitoring changes', async () => {
    const app = buildSkInventoryApp({ license_allocated: 1 });
    const inventoryKey = storeknoxKeys.inventory({ limit: 10, offset: 0, monitoringStatus: -1 });

    mockSkSubscription();
    mockSkInventoryApp(app);
    mockMonitoringToggle(app);

    const { queryClient } = await renderAtRoute(detailsOf(app.id));

    queryClient.setQueryData(
      inventoryKey,
      transformPaginatedResponse({ count: 1, next: null, previous: null, results: [app] })
    );

    await userEvent.click(
      await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') })
    );

    await waitFor(() => expect(queryClient.getQueryState(inventoryKey)?.isInvalidated).toBe(true));
  });
});

describe('closing the licence drawer', () => {
  it('puts the switch back when the drawer is closed', async () => {
    signInToStoreknox({ is_owner: true });
    mockStoreknoxOrganization();
    mockSkSubscription({ licenses_remaining: 4 });

    const app = buildSkInventoryApp({ license_allocated: 0, monitoring_enabled: false });

    mockSkInventoryApp(app);

    await renderAtRoute(detailsOf(app.id));

    const toggle = await screen.findByRole('switch', { name: akMT('storeknox.monitoringAction') });

    await userEvent.click(toggle);
    await userEvent.click(await screen.findByRole('button', { name: akMT('close') }));

    await waitFor(() => expect(toggle).not.toBeChecked());
  });
});
