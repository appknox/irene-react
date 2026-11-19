import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { ENUMS } from '@irene/enums';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';

import {
  buildBrandAbuseSkFakeApp,
  buildIgnoredSkFakeApp,
  buildSkFakeApp,
  buildSkFakeAppStore,
  buildSkInventoryApp,
} from '@tests/factories';

import {
  mockSkFakeAppReview,
  mockSkFakeApps,
  mockSkInventoryApp,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { fakeAppConfidence } from '@/features/storeknox/utils/fake-app';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const listOf = (id: number, tab = '') => `/dashboard/storeknox/fake-apps/${id}${tab}`;

/** An inventory app whose detection has results, served as the app the list is about. */
function mockApp(overrides: Parameters<typeof buildSkInventoryApp>[0] = {}) {
  const app = buildSkInventoryApp({
    fake_app_detection_status: ENUMS.SK_FAKE_APP_DETECTION_STATUS.HAS_RESULTS,
    fake_app_counts: {
      brand_abuse: faker.number.int({ min: 11, max: 19 }),
      fake_app: faker.number.int({ min: 21, max: 29 }),
      ignored: faker.number.int({ min: 31, max: 39 }),
    },
    ...overrides,
  });

  mockSkInventoryApp(app);

  return app;
}

describe('one app’s fake-app list', () => {
  const signIn = () => {
    signInToStoreknox();
    mockStoreknoxOrganization({ sk_features: { fake_app_detection: true } });
  };

  it('shows the in-progress state while detection initializes, even on a deep-linked tab', async () => {
    signIn();

    const app = mockApp({
      fake_app_detection_status: ENUMS.SK_FAKE_APP_DETECTION_STATUS.INITIALIZING,
    });

    const received = mockSkFakeApps(app.id, { ignored: [buildIgnoredSkFakeApp()] });

    await renderAtRoute(listOf(app.id, '/ignored'));

    expect(await screen.findByText(akMT('storeknox.fakeApps.detectionInProgress'))).toBeVisible();

    expect(
      screen.getByText(akMT('storeknox.fakeApps.detectionInProgressDescription'))
    ).toBeVisible();

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(received).toHaveLength(0);
  });

  it('shows nothing found when no copy has been detected', async () => {
    signIn();

    const app = mockApp({ fake_app_counts: { brand_abuse: 0, fake_app: 0, ignored: 0 } });

    await renderAtRoute(listOf(app.id));

    expect(await screen.findByText(akMT('storeknox.fakeApps.noSuspectedApps'))).toBeVisible();

    expect(screen.getByText(akMT('storeknox.fakeApps.noSuspectedAppsDescription'))).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows nothing found with the decommissioned wording for a decommissioned app', async () => {
    signIn();

    const app = mockApp({
      app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED,
      fake_app_counts: null,
    });

    await renderAtRoute(listOf(app.id));

    expect(
      await screen.findByText(akMT('storeknox.fakeApps.noSuspectedAppsDecommissionedDescription'))
    ).toBeVisible();
  });

  it('badges each tab with its count from the app', async () => {
    signIn();

    const app = mockApp();
    const counts = app.fake_app_counts;

    mockSkFakeApps(app.id);

    await renderAtRoute(listOf(app.id));

    const tabs = await screen.findByRole('tablist');

    const brandAbuseTab = within(tabs).getByRole('tab', { name: /Brand Abuse/ });

    expect(brandAbuseTab).toHaveTextContent(String(counts?.brand_abuse));
    expect(brandAbuseTab).toHaveAttribute('aria-selected', 'true');

    expect(
      within(tabs).getByRole('tab', { name: new RegExp(akMT('storeknox.fakeApps.fakeApp')) })
    ).toHaveTextContent(String(counts?.fake_app));

    expect(
      within(tabs).getByRole('tab', { name: new RegExp(akMT('storeknox.fakeApps.ignored')) })
    ).toHaveTextContent(String(counts?.ignored));
  });

  it('lists the brand abuse tab’s copies with store, namespace, developer and confidence', async () => {
    signIn();

    const app = mockApp();
    const copies = [buildBrandAbuseSkFakeApp(), buildBrandAbuseSkFakeApp()];
    const received = mockSkFakeApps(app.id, { brandAbuse: copies });

    await renderAtRoute(listOf(app.id));

    for (const copy of copies) {
      const row = (await screen.findByText(copy.title)).closest('tr');

      expect(row).not.toBeNull();

      const cells = within(row as HTMLElement);

      expect(cells.getByText(copy.package_name)).toBeVisible();
      expect(cells.getByText(copy.dev_name)).toBeVisible();
      expect(cells.getByText(`${fakeAppConfidence(copy)}%`)).toBeVisible();
    }

    expect(received[0]?.get('status')).toBe('pending');
    expect(received[0]?.get('classification')).toBe('brand_abuse');
    expect(screen.getByText(akMT('storeknox.fakeApps.brandAbuseInfo'))).toBeVisible();
  });

  it('reads a copy with no confidence score as 0%', async () => {
    signIn();

    const app = mockApp();
    const copy = buildBrandAbuseSkFakeApp({ ai_scores: {} });

    mockSkFakeApps(app.id, { brandAbuse: [copy] });

    await renderAtRoute(listOf(app.id));

    const row = (await screen.findByText(copy.title)).closest('tr');

    expect(within(row as HTMLElement).getByText('0%')).toBeVisible();
  });

  it('lists the fake app tab’s copies under the fake app classification', async () => {
    signIn();

    const app = mockApp();
    const copy = buildSkFakeApp();
    const received = mockSkFakeApps(app.id, { fakeApp: [copy] });

    await renderAtRoute(listOf(app.id, '/fake-apps'));

    expect(await screen.findByText(copy.title)).toBeVisible();
    expect(received[0]?.get('status')).toBe('pending');
    expect(received[0]?.get('classification')).toBe('fake_app');
    expect(screen.getByText(akMT('storeknox.fakeApps.fakeAppsInfo'))).toBeVisible();
  });

  it('asks the ignored tab for ignored copies without a classification and shows no action column', async () => {
    signIn();

    const app = mockApp();
    const copy = buildIgnoredSkFakeApp();
    const received = mockSkFakeApps(app.id, { ignored: [copy] });

    await renderAtRoute(listOf(app.id, '/ignored'));

    expect(await screen.findByText(copy.title)).toBeVisible();
    expect(received[0]?.get('status')).toBe('ignored');
    expect(received[0]?.has('classification')).toBe(false);
    expect(screen.queryByRole('columnheader', { name: akMT('action') })).not.toBeInTheDocument();
    expect(screen.getByText(akMT('storeknox.fakeApps.ignoredInfo'))).toBeVisible();
  });

  /** Holds the fake-app list request open, so the tab stays in its loading state. */
  const holdFakeAppList = (skAppId: number) =>
    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.fakeApps(skAppId)), () => delay('infinite'))
    );

  it('draws as many placeholder rows as the tab’s first page will fill', async () => {
    signIn();

    const brandAbuse = faker.number.int({ min: 2, max: 9 });
    const app = mockApp({ fake_app_counts: { brand_abuse: brandAbuse, fake_app: 0, ignored: 0 } });

    holdFakeAppList(app.id);

    await renderAtRoute(listOf(app.id));

    const table = await screen.findByRole('table');

    expect(within(table).getAllByRole('row')).toHaveLength(brandAbuse + 1);
  });

  it('caps the placeholder rows at one page when the tab counts more copies', async () => {
    signIn();

    const app = mockApp();

    holdFakeAppList(app.id);

    await renderAtRoute(listOf(app.id));

    const table = await screen.findByRole('table');

    expect(within(table).getAllByRole('row')).toHaveLength(10 + 1);
  });

  it('shows a tab counted empty without a placeholder table while it loads', async () => {
    signIn();

    const app = mockApp({
      fake_app_counts: {
        brand_abuse: 0,
        fake_app: faker.number.int({ min: 1, max: 9 }),
        ignored: 0,
      },
    });

    holdFakeAppList(app.id);

    await renderAtRoute(listOf(app.id));

    expect(await screen.findByText(akMT('storeknox.fakeApps.noBrandAbuseFound'))).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows an error state instead of placeholder rows when the tab’s list fails to load', async () => {
    signIn();

    const app = mockApp();

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.fakeApps(app.id)), () =>
        HttpResponse.json({ detail: faker.lorem.sentence() }, { status: 500 })
      )
    );

    await renderAtRoute(listOf(app.id));

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows the error state, not the empty state, when a tab counted empty fails to load', async () => {
    signIn();

    const app = mockApp({
      fake_app_counts: {
        brand_abuse: 0,
        fake_app: faker.number.int({ min: 1, max: 9 }),
        ignored: 0,
      },
    });

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.fakeApps(app.id)), () =>
        HttpResponse.json({ detail: faker.lorem.sentence() }, { status: 500 })
      )
    );

    await renderAtRoute(listOf(app.id));

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeVisible();

    expect(
      screen.queryByText(akMT('storeknox.fakeApps.noBrandAbuseFound'))
    ).not.toBeInTheDocument();
  });

  it('shows each tab’s own empty state when it has no copies', async () => {
    signIn();

    const app = mockApp();

    mockSkFakeApps(app.id, { fakeApp: [buildSkFakeApp()] });

    await renderAtRoute(listOf(app.id));

    expect(await screen.findByText(akMT('storeknox.fakeApps.noBrandAbuseFound'))).toBeVisible();

    expect(screen.getByText(akMT('storeknox.fakeApps.noBrandAbuseFoundDescription'))).toBeVisible();

    await userEvent.click(
      screen.getByRole('tab', { name: new RegExp(akMT('storeknox.fakeApps.ignored')) })
    );

    expect(await screen.findByText(akMT('storeknox.fakeApps.noIgnoredApps'))).toBeVisible();

    await userEvent.click(
      screen.getByRole('tab', { name: new RegExp(akMT('storeknox.fakeApps.fakeApp')) })
    );

    expect(await screen.findByText(akMT('storeknox.fakeApps.fakeAppsInfo'))).toBeVisible();
  });

  it('keeps the tab’s page in the URL', async () => {
    signIn();

    const app = mockApp();
    const copies = Array.from({ length: 12 }, () => buildBrandAbuseSkFakeApp());

    mockSkFakeApps(app.id, { brandAbuse: copies });

    const { router } = await renderAtRoute(listOf(app.id));

    expect(await screen.findByText(copies[0]?.title ?? '')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: akMT('next') }));

    await waitFor(() => expect(router.state.location.search).toMatchObject({ offset: 10 }));

    expect(await screen.findByText(copies[10]?.title ?? '')).toBeVisible();
    expect(screen.queryByText(copies[0]?.title ?? '')).not.toBeInTheDocument();
  });

  it('opens the second page again on a reload of its URL', async () => {
    signIn();

    const app = mockApp();
    const copies = Array.from({ length: 12 }, () => buildBrandAbuseSkFakeApp());

    mockSkFakeApps(app.id, { brandAbuse: copies });

    await renderAtRoute(`${listOf(app.id)}?offset=10`);

    expect(await screen.findByText(copies[11]?.title ?? '')).toBeVisible();
    expect(screen.queryByText(copies[0]?.title ?? '')).not.toBeInTheDocument();
  });

  it('steps back a page when its offset is past the last one', async () => {
    signIn();

    const app = mockApp();
    const copies = Array.from({ length: 12 }, () => buildBrandAbuseSkFakeApp());

    mockSkFakeApps(app.id, { brandAbuse: copies });

    const { router } = await renderAtRoute(`${listOf(app.id)}?offset=20`);

    expect(await screen.findByText(copies[10]?.title ?? '')).toBeVisible();
    expect(router.state.location.search).toMatchObject({ offset: 10 });
  });

  it('opens a copy’s details from its row', async () => {
    signIn();

    const app = mockApp();
    const copy = buildBrandAbuseSkFakeApp();

    mockSkFakeApps(app.id, { brandAbuse: [copy] });

    const { router } = await renderAtRoute(listOf(app.id));

    await userEvent.click(await screen.findByText(copy.package_name));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`${listOf(app.id)}/details/${copy.id}`)
    );
  });

  it('links back to the app in the inventory from the header menu', async () => {
    signIn();

    const app = mockApp();

    mockSkFakeApps(app.id);

    const { router } = await renderAtRoute(listOf(app.id));

    await userEvent.click(await screen.findByRole('button', { name: akMT('actions') }));
    await userEvent.click(await screen.findByText(akMT('storeknox.viewInInventory')));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `/dashboard/storeknox/inventory-details/${app.id}`
      )
    );
  });

  it('heads the list with the app, its last detection date and a trail to the listing', async () => {
    signIn();

    const app = mockApp();

    mockSkFakeApps(app.id);

    await renderAtRoute(listOf(app.id));

    expect(await screen.findByText(app.app_metadata.title)).toBeVisible();

    expect(
      screen.getByText(formatDateTime(app.last_fake_detection_on, 'mediumDate'))
    ).toBeVisible();

    const trail = screen.getByRole('navigation', { name: akMT('storeknox.fakeAppsTitle') });

    expect(
      within(trail).getByRole('link', { name: akMT('storeknox.fakeAppsTitle') })
    ).toHaveAttribute('href', '/dashboard/storeknox/fake-apps');

    expect(within(trail).getByText(app.app_metadata.package_name)).toBeVisible();
  });

  it('shows the archived banner above the header', async () => {
    signIn();

    const app = mockApp({
      app_status: ENUMS.SK_APP_STATUS.ARCHIVED,
      archived_on: faker.date.past().toISOString(),
      unarchive_available_on: faker.date.future().toISOString(),
    });

    mockSkFakeApps(app.id);

    await renderAtRoute(listOf(app.id));

    const banner = await screen.findByRole('status');

    expect(banner).toHaveTextContent(formatDateTime(app.archived_on, 'mediumDate'));
    expect(banner).toHaveTextContent(formatDateTime(app.unarchive_available_on, 'mediumDate'));
  });

  it('shows the decommissioned banner', async () => {
    signIn();

    const app = mockApp({
      app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED,
      decommissioned_on: faker.date.past().toISOString(),
    });

    mockSkFakeApps(app.id);

    await renderAtRoute(listOf(app.id));

    expect(await screen.findByRole('status')).toHaveTextContent(
      formatDateTime(app.decommissioned_on, 'mediumDate')
    );
  });

  it('shows the monitoring-off banner', async () => {
    signIn();

    const app = mockApp({ monitoring_enabled: false });

    mockSkFakeApps(app.id);

    await renderAtRoute(listOf(app.id));

    expect(await screen.findByRole('status')).toBeVisible();
  });

  it('shows apkmody’s and aptoide’s own store icons', async () => {
    signIn();

    const app = mockApp();

    const apkmody = buildBrandAbuseSkFakeApp({
      store: buildSkFakeAppStore({ identifier: 'apkmody', name: 'APKMODY store' }),
    });

    const aptoide = buildBrandAbuseSkFakeApp({
      store: buildSkFakeAppStore({ identifier: 'aptoide', name: 'Aptoide store' }),
    });

    mockSkFakeApps(app.id, { brandAbuse: [apkmody, aptoide] });

    await renderAtRoute(listOf(app.id));

    const apkmodyIcon = await screen.findByRole('img', { name: apkmody.store.name });

    expect(apkmodyIcon.tagName).toBe('IMG');
    expect(apkmodyIcon).toHaveAttribute('src', expect.stringContaining('apkmody-icon'));
    expect(screen.getByRole('img', { name: aptoide.store.name }).tagName).toBe('svg');
  });

  it('shows the Play Store’s and the App Store’s logos', async () => {
    signIn();

    const app = mockApp();

    const play = buildBrandAbuseSkFakeApp({
      store: buildSkFakeAppStore({ platform: ENUMS.PLATFORM.ANDROID }),
    });

    const apple = buildBrandAbuseSkFakeApp({
      store: buildSkFakeAppStore({ platform: ENUMS.PLATFORM.IOS }),
    });

    mockSkFakeApps(app.id, { brandAbuse: [play, apple] });

    await renderAtRoute(listOf(app.id));

    const playRow = (await screen.findByText(play.title)).closest('tr');
    const appleRow = screen.getByText(apple.title).closest('tr');

    expect(
      within(playRow as HTMLElement).getByRole('img', { name: play.store.name })
    ).toBeVisible();

    expect(
      within(appleRow as HTMLElement).getByRole('img', { name: apple.store.name })
    ).toBeVisible();
  });
});

describe('a copy’s row actions', () => {
  const signIn = () => {
    signInToStoreknox();
    mockStoreknoxOrganization({ sk_features: { fake_app_detection: true } });
  };

  const rowOf = async (title: string) => {
    const row = (await screen.findByText(title)).closest('tr');

    expect(row).not.toBeNull();

    return within(row as HTMLElement);
  };

  const reviewed = (copy: ReturnType<typeof buildBrandAbuseSkFakeApp>) => ({
    id: copy.id,
    status: ENUMS.SK_FAKE_APP_STATUS.IGNORED,
    status_display: 'Ignored',
    reviewed_by: faker.person.fullName(),
    reviewed_on: faker.date.recent().toISOString(),
    ignore_reason: faker.lorem.sentence(),
  });

  it('offers only Ignore for apkmody and aptoide copies', async () => {
    signIn();

    const app = mockApp();

    const apkmody = buildBrandAbuseSkFakeApp({
      store: buildSkFakeAppStore({ identifier: 'apkmody', name: 'APKMODY store' }),
    });

    const aptoide = buildBrandAbuseSkFakeApp({
      store: buildSkFakeAppStore({ identifier: 'aptoide', name: 'Aptoide store' }),
    });

    mockSkFakeApps(app.id, { brandAbuse: [apkmody, aptoide] });

    await renderAtRoute(listOf(app.id));

    for (const copy of [apkmody, aptoide]) {
      const row = await rowOf(copy.title);

      await userEvent.click(row.getByRole('button', { name: akMT('actions') }));

      expect(
        await screen.findByRole('menuitem', { name: akMT('storeknox.fakeApps.ignore') })
      ).toBeVisible();

      expect(
        screen.queryByRole('menuitem', { name: akMT('storeknox.fakeApps.ignoreAndAddToInventory') })
      ).not.toBeInTheDocument();

      await userEvent.keyboard('{Escape}');
    }
  });

  it('offers Ignore and Ignore & Add to Inventory for a store that can be monitored', async () => {
    signIn();

    const app = mockApp();
    const copy = buildBrandAbuseSkFakeApp();

    mockSkFakeApps(app.id, { brandAbuse: [copy] });

    await renderAtRoute(listOf(app.id));

    await userEvent.click((await rowOf(copy.title)).getByRole('button', { name: akMT('actions') }));

    expect(
      await screen.findByRole('menuitem', {
        name: akMT('storeknox.fakeApps.ignoreAndAddToInventory'),
      })
    ).toBeEnabled();
  });

  it('ignores a copy with a reason and drops it from the list', async () => {
    signIn();

    const app = mockApp();
    const copy = buildBrandAbuseSkFakeApp();
    const copies = [copy];
    const reason = faker.lorem.sentence();
    let body: unknown;

    mockSkFakeApps(app.id, { brandAbuse: copies });

    server.use(
      http.post(
        buildAPITestURL(StoreknoxEndpoints.ignoreFakeApp(app.id, copy.id)),
        async ({ request }) => {
          body = await request.json();
          copies.splice(0, 1);

          return HttpResponse.json(reviewed(copy));
        }
      )
    );

    await renderAtRoute(listOf(app.id));

    await userEvent.click((await rowOf(copy.title)).getByRole('button', { name: akMT('actions') }));

    await userEvent.click(
      await screen.findByRole('menuitem', { name: akMT('storeknox.fakeApps.ignore') })
    );

    await userEvent.type(await screen.findByRole('textbox', { name: akMT('reason') }), reason);

    await userEvent.click(screen.getByRole('button', { name: akMT('storeknox.yesIgnore') }));

    expect(await screen.findByText(akMT('storeknox.appIgnoredSuccessfully'))).toBeVisible();
    expect(body).toEqual({ ignore_reason: reason });

    await waitFor(() => expect(screen.queryByText(copy.title)).not.toBeInTheDocument());
  });

  it('adds a copy to the inventory from the same menu', async () => {
    signIn();

    const app = mockApp();
    const copy = buildBrandAbuseSkFakeApp();
    const reason = faker.lorem.sentence();

    mockSkFakeApps(app.id, { brandAbuse: [copy] });

    const bodies = mockSkFakeAppReview(app.id, copy.id, 'add-to-inventory', reviewed(copy));

    await renderAtRoute(listOf(app.id));

    await userEvent.click((await rowOf(copy.title)).getByRole('button', { name: akMT('actions') }));

    await userEvent.click(
      await screen.findByRole('menuitem', {
        name: akMT('storeknox.fakeApps.ignoreAndAddToInventory'),
      })
    );

    await userEvent.type(await screen.findByRole('textbox', { name: akMT('reason') }), reason);

    await userEvent.click(
      screen.getByRole('button', { name: akMT('storeknox.yesIgnoreAndAddToInventory') })
    );

    expect(
      await screen.findByText(akMT('storeknox.appIgnoredAndAddedToInventorySuccessfully'))
    ).toBeVisible();

    expect(bodies).toEqual([{ ignore_reason: reason }]);
  });

  it('disables both row actions for a decommissioned app with the decommissioned tooltip', async () => {
    signIn();

    const app = mockApp({ app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED });
    const copy = buildBrandAbuseSkFakeApp();

    mockSkFakeApps(app.id, { brandAbuse: [copy] });

    await renderAtRoute(listOf(app.id));

    await userEvent.click((await rowOf(copy.title)).getByRole('button', { name: akMT('actions') }));

    const ignore = await screen.findByRole('menuitem', { name: akMT('storeknox.fakeApps.ignore') });

    const ignoreAndAdd = screen.getByRole('menuitem', {
      name: akMT('storeknox.fakeApps.ignoreAndAddToInventory'),
    });

    expect(ignore).toHaveAttribute('aria-disabled', 'true');
    expect(ignoreAndAdd).toHaveAttribute('aria-disabled', 'true');

    await userEvent.hover(ignore);

    const tooltip = await screen.findByRole('tooltip');

    expect(tooltip).toHaveTextContent(akMT('storeknox.decommissionedActionDisabled'));
    expect(tooltip).toBeVisible();
  });

  it('refreshes the tab badges after an ignore', async () => {
    signIn();

    const app = mockApp();
    const copy = buildBrandAbuseSkFakeApp();
    const before = app.fake_app_counts;
    const brandAbuseAfter = (before?.brand_abuse ?? 0) - 1;
    const ignoredAfter = (before?.ignored ?? 0) + 1;
    let ignoredNow = false;

    mockSkFakeApps(app.id, { brandAbuse: [copy] });

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.appDetail(app.id)), () =>
        HttpResponse.json(
          ignoredNow
            ? {
                ...app,
                fake_app_counts: {
                  ...before,
                  brand_abuse: brandAbuseAfter,
                  ignored: ignoredAfter,
                },
              }
            : app
        )
      ),
      http.post(buildAPITestURL(StoreknoxEndpoints.ignoreFakeApp(app.id, copy.id)), () => {
        ignoredNow = true;

        return HttpResponse.json(reviewed(copy));
      })
    );

    await renderAtRoute(listOf(app.id));

    await userEvent.click((await rowOf(copy.title)).getByRole('button', { name: akMT('actions') }));

    await userEvent.click(
      await screen.findByRole('menuitem', { name: akMT('storeknox.fakeApps.ignore') })
    );

    await userEvent.type(
      await screen.findByRole('textbox', { name: akMT('reason') }),
      faker.lorem.word()
    );

    await userEvent.click(screen.getByRole('button', { name: akMT('storeknox.yesIgnore') }));

    const tabs = await screen.findByRole('tablist');

    await waitFor(() =>
      expect(within(tabs).getByRole('tab', { name: /Brand Abuse/ })).toHaveTextContent(
        String(brandAbuseAfter)
      )
    );

    expect(
      within(tabs).getByRole('tab', { name: new RegExp(akMT('storeknox.fakeApps.ignored')) })
    ).toHaveTextContent(String(ignoredAfter));
  });

  it('keeps the list open while the menu and drawer are used', async () => {
    signIn();

    const app = mockApp();
    const copy = buildBrandAbuseSkFakeApp();

    mockSkFakeApps(app.id, { brandAbuse: [copy] });

    const { router } = await renderAtRoute(listOf(app.id));

    await userEvent.click((await rowOf(copy.title)).getByRole('button', { name: akMT('actions') }));

    await userEvent.click(
      await screen.findByRole('menuitem', { name: akMT('storeknox.fakeApps.ignore') })
    );

    await userEvent.type(
      await screen.findByRole('textbox', { name: akMT('reason') }),
      faker.lorem.word()
    );

    await userEvent.click(screen.getByRole('button', { name: akMT('cancel') }));

    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());

    expect(router.state.location.pathname).toBe(listOf(app.id));
  });

  it('steps back a page when an ignore empties the last page', async () => {
    signIn();

    const app = mockApp();
    const copies = Array.from({ length: 11 }, () => buildBrandAbuseSkFakeApp());
    const last = copies[10] ?? buildBrandAbuseSkFakeApp();

    mockSkFakeApps(app.id, { brandAbuse: copies });

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.ignoreFakeApp(app.id, last.id)), () => {
        copies.splice(10, 1);

        return HttpResponse.json(reviewed(last));
      })
    );

    const { router } = await renderAtRoute(`${listOf(app.id)}?offset=10`);

    await userEvent.click((await rowOf(last.title)).getByRole('button', { name: akMT('actions') }));

    await userEvent.click(
      await screen.findByRole('menuitem', { name: akMT('storeknox.fakeApps.ignore') })
    );

    await userEvent.type(
      await screen.findByRole('textbox', { name: akMT('reason') }),
      faker.lorem.word()
    );

    await userEvent.click(screen.getByRole('button', { name: akMT('storeknox.yesIgnore') }));

    expect(await screen.findByText(copies[0]?.title ?? '')).toBeVisible();
    expect(router.state.location.search).not.toHaveProperty('offset');
  });
});
