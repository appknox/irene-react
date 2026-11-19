import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ENUMS } from '@irene/enums';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';

import {
  mockSkAppLists,
  mockSkFakeAppInventory,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { suspectedShare, suspectedTotal } from '@/features/storeknox/utils/fake-app';
import { buildSkFakeAppInventoryApp } from '@tests/factories';
import { renderAtRoute } from '@tests/render';

const FAKE_APPS = '/dashboard/storeknox/fake-apps';
const SEARCH_WAIT = { timeout: 3000 };

const withFakeAppDetection = () =>
  mockStoreknoxOrganization({ sk_features: { fake_app_detection: true } });

describe('the fake-app listing', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends an organization without fake-app detection to the inventory', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization({ sk_features: { fake_app_detection: false } });
    mockSkAppLists();

    const { router } = await renderAtRoute(FAKE_APPS);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard/storeknox/inventory/app-list')
    );
  });

  it('sends an organization whose features cannot be read to the inventory', async () => {
    signInToStoreknox();
    mockSkAppLists();

    const { router } = await renderAtRoute(FAKE_APPS);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard/storeknox/inventory/app-list')
    );
  });

  it('shows a card per app with its suspected totals and last monitoring date', async () => {
    signInToStoreknox();
    withFakeAppDetection();

    const active = buildSkFakeAppInventoryApp({ app_status: ENUMS.SK_APP_STATUS.ACTIVE });

    const gone = buildSkFakeAppInventoryApp({
      app_status: ENUMS.SK_APP_STATUS.DECOMMISSIONED,
      fake_app_counts: { brand_abuse: 3, fake_app: 4, ignored: 1 },
    });

    mockSkFakeAppInventory([active, gone]);

    await renderAtRoute(FAKE_APPS);

    for (const app of [active, gone]) {
      const card = (await screen.findByText(app.app_metadata.package_name)).closest(
        '[data-test-sk-fake-app-card]'
      ) as HTMLElement;

      const inCard = within(card);
      const counts = app.fake_app_counts;
      const total = suspectedTotal(counts);

      expect(inCard.getByText(app.app_metadata.title)).toBeInTheDocument();
      expect(inCard.getByText(String(total))).toBeInTheDocument();
      expect(inCard.getByText(akMT('storeknox.fakeApps.suspectedApps'))).toBeInTheDocument();

      const brandAbuseRow = inCard.getByText(akMT('storeknox.brandAbuse')).parentElement;
      const fakeAppRow = inCard.getByText(akMT('storeknox.fakeApps.fakeApp')).parentElement;

      expect(brandAbuseRow).toHaveTextContent(`${counts?.brand_abuse} ${akMT('outOf')} ${total}`);
      expect(fakeAppRow).toHaveTextContent(`${counts?.fake_app} ${akMT('outOf')} ${total}`);

      const [brandAbuseBar, fakeAppBar] = inCard.getAllByRole<HTMLProgressElement>('progressbar');

      /* A determinate bar carries a `value` attribute; an indeterminate one reports position -1. */
      expect(brandAbuseBar).toHaveAttribute('value');
      expect(fakeAppBar).toHaveAttribute('value');
      expect(brandAbuseBar.position).toBeGreaterThanOrEqual(0);
      expect(fakeAppBar.position).toBeGreaterThanOrEqual(0);
      expect(brandAbuseBar.value).toBeCloseTo(suspectedShare(counts?.brand_abuse ?? 0, total));
      expect(fakeAppBar.value).toBeCloseTo(suspectedShare(counts?.fake_app ?? 0, total));

      expect(
        inCard.getByText(formatDateTime(app.last_fake_detection_on, 'mediumDate'))
      ).toBeInTheDocument();
    }

    const gonePackage = (await screen.findByText(gone.app_metadata.package_name)).closest(
      '[data-test-sk-fake-app-card]'
    ) as HTMLElement;

    const activePackage = screen
      .getByText(active.app_metadata.package_name)
      .closest('[data-test-sk-fake-app-card]') as HTMLElement;

    expect(within(gonePackage).getByText(akMT('storeknox.decommissioned'))).toBeInTheDocument();
    expect(within(activePackage).queryByText(akMT('storeknox.decommissioned'))).toBeNull();
  });

  it('shows empty progress for an app with no suspected copies', async () => {
    signInToStoreknox();
    withFakeAppDetection();

    const app = buildSkFakeAppInventoryApp({
      fake_app_counts: { brand_abuse: 0, fake_app: 0, ignored: 2 },
    });

    mockSkFakeAppInventory([app]);

    await renderAtRoute(FAKE_APPS);

    await screen.findByText(app.app_metadata.package_name);

    const bars = screen.getAllByRole<HTMLProgressElement>('progressbar');

    expect(bars).toHaveLength(2);
    expect(bars.map((bar) => bar.getAttribute('value'))).toEqual(['0', '0']);
    expect(bars.map((bar) => bar.position)).toEqual([0, 0]);
  });

  it('searches once after typing stops, from the first page, and keeps the search in the URL', async () => {
    signInToStoreknox();
    withFakeAppDetection();

    const match = buildSkFakeAppInventoryApp();
    const other = buildSkFakeAppInventoryApp();
    const received = mockSkFakeAppInventory([match, other]);

    const { router } = await renderAtRoute(`${FAKE_APPS}?app_offset=12`);

    await userEvent.type(
      screen.getByRole('textbox', { name: akMT('searchQuery') }),
      match.app_metadata.package_name
    );

    await waitFor(
      () => expect(received.filter((params) => params.has('q'))).toHaveLength(1),
      SEARCH_WAIT
    );

    const [searched] = received.filter((params) => params.has('q'));

    expect(searched.get('q')).toBe(match.app_metadata.package_name);
    expect(searched.get('offset')).toBe('0');
    expect(router.state.location.search).toMatchObject({ q: match.app_metadata.package_name });
    expect(router.state.location.search).not.toHaveProperty('app_offset');

    await waitFor(() => expect(screen.queryByText(other.app_metadata.package_name)).toBeNull());

    expect(screen.getByText(match.app_metadata.package_name)).toBeInTheDocument();
  });

  it('clears the search and lists every app again', async () => {
    signInToStoreknox();
    withFakeAppDetection();

    const first = buildSkFakeAppInventoryApp();
    const second = buildSkFakeAppInventoryApp();

    mockSkFakeAppInventory([first, second]);

    const { router } = await renderAtRoute(`${FAKE_APPS}?q=${first.app_metadata.package_name}`);

    await screen.findByText(first.app_metadata.package_name);

    expect(screen.queryByText(second.app_metadata.package_name)).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: akMT('clear') }));

    expect(await screen.findByText(second.app_metadata.package_name)).toBeInTheDocument();
    expect(router.state.location.search).not.toHaveProperty('q');
  });

  it('puts back the search that back navigation restores, without searching again', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });

    /* Moves past the debounce, then lets a search it fired reach MSW before the test counts requests. */
    const pastDebounce = async () => {
      await act(async () => {
        vi.advanceTimersByTime(800);
        await Promise.resolve();
      });

      await act(() => vi.runOnlyPendingTimersAsync());
    };

    signInToStoreknox();
    withFakeAppDetection();

    const first = buildSkFakeAppInventoryApp();
    const second = buildSkFakeAppInventoryApp();
    const received = mockSkFakeAppInventory([first, second]);

    const { router } = await renderAtRoute(FAKE_APPS);
    const box = await screen.findByRole('textbox', { name: akMT('searchQuery') });

    await user.type(box, first.app_metadata.package_name);

    await waitFor(
      () =>
        expect(router.state.location.search).toMatchObject({ q: first.app_metadata.package_name }),
      SEARCH_WAIT
    );

    await user.type(box, 'x');

    await waitFor(
      () =>
        expect(router.state.location.search).toMatchObject({
          q: `${first.app_metadata.package_name}x`,
        }),
      SEARCH_WAIT
    );

    const requests = received.length;

    router.history.back();

    await waitFor(() => expect(box).toHaveValue(first.app_metadata.package_name));

    await pastDebounce();

    expect(box).toHaveValue(first.app_metadata.package_name);
    expect(router.state.location.search).toMatchObject({ q: first.app_metadata.package_name });

    expect(
      received
        .slice(requests)
        .filter((params) => params.get('q') !== first.app_metadata.package_name)
    ).toHaveLength(0);

    router.history.back();

    await waitFor(() => expect(box).toHaveValue(''));
    await pastDebounce();

    expect(box).toHaveValue('');
    expect(router.state.location.search).not.toHaveProperty('q');
    expect(await screen.findByText(second.app_metadata.package_name)).toBeInTheDocument();
  });

  it('explains an empty search differently from an empty listing', async () => {
    signInToStoreknox();
    withFakeAppDetection();
    mockSkFakeAppInventory([]);

    const { unmount } = await renderAtRoute(FAKE_APPS);

    expect(
      await screen.findByText(akMT('storeknox.noSuspectedBrandAbuseFakeAppsFoundDescription'))
    ).toBeInTheDocument();

    expect(
      screen.getByText(akMT('storeknox.noSuspectedBrandAbuseFakeAppsFound'))
    ).toBeInTheDocument();

    unmount();

    await renderAtRoute(`${FAKE_APPS}?q=nothing-matches`);

    expect(
      await screen.findByText(
        akMT('storeknox.noSuspectedBrandAbuseFakeAppsFoundDescriptionWithSearch')
      )
    ).toBeInTheDocument();
  });

  it('opens the powered-by-AI drawer', async () => {
    signInToStoreknox();
    withFakeAppDetection();
    mockSkFakeAppInventory([buildSkFakeAppInventoryApp()]);

    await renderAtRoute(FAKE_APPS);

    await userEvent.click(await screen.findByRole('button', { name: akMT('aiPoweredFeatures') }));

    expect(await screen.findByText(akMT('storeknox.fakeApps.aiDataAccess'))).toBeInTheDocument();
    expect(screen.getByText(akMT('storeknox.fakeApps.aiDataUsage'))).toBeInTheDocument();
    expect(screen.getByText(akMT('storeknox.fakeApps.aiDataProtection'))).toBeInTheDocument();

    expect(
      screen.getByText(akMT('storeknox.fakeApps.aiDataProtectionList.item1'))
    ).toBeInTheDocument();
  });

  it('pages twelve at a time', async () => {
    signInToStoreknox();
    withFakeAppDetection();

    const apps = Array.from({ length: 13 }, () => buildSkFakeAppInventoryApp());
    const received = mockSkFakeAppInventory(apps);

    const { router } = await renderAtRoute(FAKE_APPS);

    await screen.findByText(apps[0].app_metadata.package_name);
    expect(screen.queryByText(apps[12].app_metadata.package_name)).toBeNull();
    expect(received[0].get('limit')).toBe('12');

    await userEvent.click(await screen.findByRole('button', { name: akMT('next') }));

    await waitFor(() => expect(router.state.location.search).toMatchObject({ app_offset: 12 }));
    await waitFor(() => expect(received.at(-1)?.get('offset')).toBe('12'));
  });

  it("opens an app's fake-app list from its card", async () => {
    signInToStoreknox();
    withFakeAppDetection();

    const app = buildSkFakeAppInventoryApp();

    mockSkFakeAppInventory([app]);

    const { router } = await renderAtRoute(FAKE_APPS);

    await userEvent.click(await screen.findByText(app.app_metadata.package_name));

    await waitFor(() => expect(router.state.location.pathname).toBe(`${FAKE_APPS}/${app.id}`));
  });
});
