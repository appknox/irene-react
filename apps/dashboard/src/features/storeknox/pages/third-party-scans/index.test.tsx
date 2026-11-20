import { faker } from '@faker-js/faker';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';

import {
  buildSkThirdPartyApp,
  buildSkThirdPartyConfig,
  buildUnscoredSkThirdPartyApp,
} from '@tests/factories';

import {
  mockSkAppLists,
  mockSkThirdPartyApp,
  mockSkThirdPartyApps,
  mockSkThirdPartyConfig,
  mockStoreknoxOrganization,
  signInToStoreknox,
} from '@tests/storeknox';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const THIRD_PARTY = '/dashboard/storeknox/third-party-scans';
const SEARCH_WAIT = { timeout: 3000 };
const RISK = ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS;

/* Two App Store regions and one Play Store region, so each store's controls differ. */
const MIXED_CONFIG = {
  appstore_regions_opted: ['US', 'SG'],
  playstore_regions_opted: ['IN'],
};

const withThirdPartyScanning = () =>
  mockStoreknoxOrganization({ sk_features: { third_party_scanning: true } });

/** Signs in to an organization with third-party scanning and answers its config. */
const setUp = (config: Partial<ReturnType<typeof buildSkThirdPartyConfig>> = MIXED_CONFIG) => {
  signInToStoreknox();
  withThirdPartyScanning();

  const built = buildSkThirdPartyConfig(config);

  mockSkThirdPartyConfig(built);

  return built;
};

const lastRequest = (received: URLSearchParams[]) => received[received.length - 1];

const pickFromSelect = async (name: string, option: string) => {
  await userEvent.click(await screen.findByRole('combobox', { name }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
};

const rowOf = async (packageName: string) =>
  within((await screen.findByText(packageName)).closest('tr') as HTMLElement);

/** Lets a search that would fire after the debounce have fired, with real timers. */
const pastDebounce = () => new Promise((resolve) => setTimeout(resolve, 900));

describe('the third-party scans list', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends an organization without third-party scanning to the inventory', async () => {
    signInToStoreknox();
    mockStoreknoxOrganization({ sk_features: { third_party_scanning: false } });
    mockSkAppLists();

    const { router } = await renderAtRoute(THIRD_PARTY);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard/storeknox/inventory/app-list')
    );
  });

  it('writes the resolved store and region into the URL', async () => {
    setUp();
    mockSkThirdPartyApps([]);

    const { router } = await renderAtRoute(THIRD_PARTY);

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ tp_store: 'appstore', tp_region: 'US' })
    );
  });

  it('replaces a region the store did not opt into with the store’s first one', async () => {
    setUp();
    mockSkThirdPartyApps([]);

    const { router } = await renderAtRoute(`${THIRD_PARTY}?tp_store=playstore&tp_region=US`);

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ tp_store: 'playstore', tp_region: 'IN' })
    );
  });

  it('lists each app with its store, application, developer, score and risk status', async () => {
    setUp();

    const minimal = buildSkThirdPartyApp({
      store: 'appstore',
      region: 'US',
      score: 12,
      risk_status: RISK.MINIMAL,
    });

    const medium = buildSkThirdPartyApp({
      store: 'playstore',
      region: 'US',
      risk_status: RISK.MEDIUM,
    });

    const high = buildSkThirdPartyApp({ store: 'appstore', region: 'US', risk_status: RISK.HIGH });
    const unscored = buildUnscoredSkThirdPartyApp({ store: 'appstore', region: 'US' });
    const unknown = buildSkThirdPartyApp({ store: 'appstore', region: 'US', risk_status: 7 });
    const apps = [minimal, medium, high, unscored, unknown];

    const received = mockSkThirdPartyApps(apps);

    await renderAtRoute(THIRD_PARTY);

    for (const app of apps) {
      const row = await rowOf(app.package_name);

      expect(row.getByText(app.title)).toBeInTheDocument();
      expect(row.getByText(app.dev_name)).toBeInTheDocument();

      expect(
        row.getByLabelText(app.store === 'appstore' ? 'App Store' : 'Play Store')
      ).toBeInTheDocument();
    }

    expect((await rowOf(minimal.package_name)).getByText('12/100')).toBeInTheDocument();
    expect((await rowOf(medium.package_name)).getByText(`${medium.score}/100`)).toBeInTheDocument();

    expect(
      (await rowOf(unscored.package_name)).getByText(akMT('storeknox.riskScoreUnavailable'))
    ).toBeInTheDocument();

    expect(
      (await rowOf(minimal.package_name)).getByText(akMT('storeknox.riskStatus.minimal'))
    ).toBeInTheDocument();

    expect(
      (await rowOf(medium.package_name)).getByText(akMT('storeknox.riskStatus.medium'))
    ).toBeInTheDocument();

    expect(
      (await rowOf(high.package_name)).getByText(akMT('storeknox.riskStatus.high'))
    ).toBeInTheDocument();

    expect(
      (await rowOf(unknown.package_name)).getByText(akMT('storeknox.riskStatus.unknown'))
    ).toBeInTheDocument();

    expect(lastRequest(received).get('store')).toBe('appstore');
    expect(lastRequest(received).get('region')).toBe('US');
    expect(lastRequest(received).get('limit')).toBe('10');
    expect(lastRequest(received).get('offset')).toBe('0');
    expect(lastRequest(received).has('filter')).toBe(false);
    expect(lastRequest(received).has('risk_status')).toBe(false);
  });

  it('offers the store select only when both stores have regions, and a region chip when the store has one', async () => {
    setUp();
    mockSkThirdPartyApps([]);

    const { unmount } = await renderAtRoute(`${THIRD_PARTY}?tp_store=appstore&tp_region=US`);

    expect(await screen.findByRole('combobox', { name: akMT('storeknox.store') })).toBeVisible();
    expect(screen.getByRole('combobox', { name: akMT('storeknox.region') })).toBeVisible();
    expect(screen.queryByText(`${akMT('storeknox.region')} - IN`)).toBeNull();

    unmount();

    await renderAtRoute(`${THIRD_PARTY}?tp_store=playstore&tp_region=IN`);

    expect(await screen.findByText(`${akMT('storeknox.region')} - IN`)).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: akMT('storeknox.region') })).toBeNull();
  });

  it('leaves the store select out when only one store has regions, naming a region by its label', async () => {
    setUp({ appstore_regions_opted: ['US'], playstore_regions_opted: [] });
    mockSkThirdPartyApps([]);

    await renderAtRoute(THIRD_PARTY);

    expect(
      await screen.findByText(`${akMT('storeknox.region')} - ${akMT('storeknox.regionNames.US')}`)
    ).toBeInTheDocument();

    expect(screen.queryByRole('combobox', { name: akMT('storeknox.store') })).toBeNull();
  });

  it('clears the region and the page when the store changes', async () => {
    setUp();

    const received = mockSkThirdPartyApps([]);

    const { router } = await renderAtRoute(
      `${THIRD_PARTY}?tp_store=appstore&tp_region=SG&tp_offset=10`
    );

    await pickFromSelect(akMT('storeknox.store'), akMT('storeknox.playStore'));

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ tp_store: 'playstore', tp_region: 'IN' })
    );

    expect(router.state.location.search).not.toHaveProperty('tp_offset');

    await waitFor(() => expect(lastRequest(received).get('store')).toBe('playstore'));

    expect(lastRequest(received).get('region')).toBe('IN');
    expect(lastRequest(received).get('offset')).toBe('0');
  });

  it('returns to the first page when the region changes', async () => {
    setUp();

    const received = mockSkThirdPartyApps([]);

    const { router } = await renderAtRoute(
      `${THIRD_PARTY}?tp_store=appstore&tp_region=US&tp_offset=10`
    );

    await pickFromSelect(akMT('storeknox.region'), akMT('storeknox.regionNames.SG'));

    await waitFor(() => expect(router.state.location.search).toMatchObject({ tp_region: 'SG' }));

    expect(router.state.location.search).not.toHaveProperty('tp_offset');
    expect(lastRequest(received).get('region')).toBe('SG');
    expect(lastRequest(received).get('offset')).toBe('0');
  });

  it('filters by risk status, sending its label', async () => {
    setUp();

    const high = buildSkThirdPartyApp({ store: 'appstore', region: 'US', risk_status: RISK.HIGH });

    const minimal = buildSkThirdPartyApp({
      store: 'appstore',
      region: 'US',
      risk_status: RISK.MINIMAL,
    });

    const received = mockSkThirdPartyApps([high, minimal]);

    const { router } = await renderAtRoute(
      `${THIRD_PARTY}?tp_store=appstore&tp_region=US&tp_offset=10`
    );

    await pickFromSelect(akMT('riskStatus'), akMT('storeknox.riskStatus.high'));

    expect(await screen.findByText(high.package_name)).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText(minimal.package_name)).toBeNull());

    expect(lastRequest(received).get('risk_status')).toBe('high');
    expect(lastRequest(received).get('offset')).toBe('0');
    expect(router.state.location.search).toMatchObject({ tp_risk_status: RISK.HIGH });

    await pickFromSelect(akMT('riskStatus'), akMT('all'));

    expect(await screen.findByText(minimal.package_name)).toBeInTheDocument();
    expect(lastRequest(received).has('risk_status')).toBe(false);
  });

  it('searches once after typing stops, from the first page', async () => {
    setUp();

    const match = buildSkThirdPartyApp({ store: 'appstore', region: 'US' });
    const other = buildSkThirdPartyApp({ store: 'appstore', region: 'US' });
    const received = mockSkThirdPartyApps([match, other]);

    const { router } = await renderAtRoute(
      `${THIRD_PARTY}?tp_store=appstore&tp_region=US&tp_offset=1`
    );

    await userEvent.type(
      await screen.findByRole('textbox', { name: akMT('searchQuery') }),
      match.package_name
    );

    await waitFor(
      () => expect(received.filter((params) => params.has('filter'))).toHaveLength(1),
      SEARCH_WAIT
    );

    const [searched] = received.filter((params) => params.has('filter'));

    expect(searched.get('filter')).toBe(match.package_name);
    expect(searched.get('offset')).toBe('0');
    expect(router.state.location.search).toMatchObject({ tp_filter: match.package_name });
    expect(router.state.location.search).not.toHaveProperty('tp_offset');

    expect(await screen.findByText(match.package_name)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(other.package_name)).toBeNull());
  });

  it('drops a search cleared before it fires, and follows back and forward', async () => {
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

    setUp();

    const first = buildSkThirdPartyApp({ store: 'appstore', region: 'US' });
    const second = buildSkThirdPartyApp({ store: 'appstore', region: 'US' });
    const received = mockSkThirdPartyApps([first, second]);

    const { router } = await renderAtRoute(`${THIRD_PARTY}?tp_store=appstore&tp_region=US`);
    const box = await screen.findByRole('textbox', { name: akMT('searchQuery') });

    await screen.findByText(first.package_name);

    await user.type(box, 'abandoned');
    await user.click(screen.getByRole('button', { name: akMT('clear') }));
    await pastDebounce();

    expect(box).toHaveValue('');
    expect(received.filter((params) => params.has('filter'))).toHaveLength(0);
    expect(router.state.location.search).not.toHaveProperty('tp_filter');

    await user.type(box, first.package_name);

    await waitFor(
      () => expect(router.state.location.search).toMatchObject({ tp_filter: first.package_name }),
      SEARCH_WAIT
    );

    await user.type(box, 'x');

    await waitFor(
      () =>
        expect(router.state.location.search).toMatchObject({ tp_filter: `${first.package_name}x` }),
      SEARCH_WAIT
    );

    const requests = received.length;

    router.history.back();

    await waitFor(() => expect(box).toHaveValue(first.package_name));
    await pastDebounce();

    expect(box).toHaveValue(first.package_name);
    expect(router.state.location.search).toMatchObject({ tp_filter: first.package_name });

    expect(
      received.slice(requests).filter((params) => params.get('filter') !== first.package_name)
    ).toHaveLength(0);

    router.history.back();

    await waitFor(() => expect(box).toHaveValue(''));
    await pastDebounce();

    expect(box).toHaveValue('');
    expect(router.state.location.search).not.toHaveProperty('tp_filter');
    expect(await screen.findByText(second.package_name)).toBeInTheDocument();
  });

  it('pages ten at a time through tp_limit and tp_offset', async () => {
    setUp();

    const apps = Array.from({ length: 12 }, () =>
      buildSkThirdPartyApp({ store: 'appstore', region: 'US' })
    );

    const received = mockSkThirdPartyApps(apps);
    const { router } = await renderAtRoute(`${THIRD_PARTY}?tp_store=appstore&tp_region=US`);

    await screen.findByText(apps[0].package_name);

    expect(screen.getAllByRole('row')).toHaveLength(11);
    expect(lastRequest(received).get('limit')).toBe('10');

    await userEvent.click(screen.getByRole('button', { name: akMT('next') }));

    expect(await screen.findByText(apps[10].package_name)).toBeInTheDocument();
    expect(router.state.location.search).toMatchObject({ tp_offset: 10 });
    expect(lastRequest(received).get('offset')).toBe('10');

    await userEvent.click(await screen.findByRole('combobox', { name: akMT('recordPerPage') }));
    await userEvent.click(await screen.findByRole('option', { name: '25' }));

    await waitFor(() => expect(router.state.location.search).toMatchObject({ tp_limit: 25 }));

    expect(router.state.location.search).not.toHaveProperty('tp_offset');
    expect(lastRequest(received).get('limit')).toBe('25');
    expect(lastRequest(received).get('offset')).toBe('0');
  });

  it('shows the empty state and sends no request when nothing is opted', async () => {
    setUp({ appstore_regions_opted: [], playstore_regions_opted: [] });

    const received = mockSkThirdPartyApps([buildSkThirdPartyApp()]);
    const { router } = await renderAtRoute(THIRD_PARTY);

    expect(await screen.findByText(akMT('noDataAvailable'))).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: akMT('storeknox.store') })).toBeNull();
    expect(screen.queryByRole('combobox', { name: akMT('storeknox.region') })).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
    expect(received).toHaveLength(0);
    expect(router.state.location.search).not.toHaveProperty('tp_store');
  });

  it('shows no data when the list is empty', async () => {
    setUp();
    mockSkThirdPartyApps([]);

    await renderAtRoute(THIRD_PARTY);

    expect(await screen.findByText(akMT('noDataAvailable'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('next') })).toBeNull();
  });

  it('shows an error state when the list fails', async () => {
    setUp();

    const message = faker.lorem.sentence();

    server.use(
      http.get(buildAPITestURL(StoreknoxEndpoints.thirdPartyApps()), () =>
        HttpResponse.json({ detail: message }, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(THIRD_PARTY);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('opens an app’s details with its store and the resolved region', async () => {
    setUp();

    const app = buildSkThirdPartyApp({ store: 'appstore', region: 'SG' });
    mockSkThirdPartyApps([app]);

    const { router } = await renderAtRoute(`${THIRD_PARTY}?tp_store=appstore&tp_region=SG`);

    await userEvent.click(await screen.findByText(app.package_name));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`${THIRD_PARTY}/${app.package_name}`)
    );

    expect(router.state.location.search).toMatchObject({ tp_store: 'appstore', tp_region: 'SG' });
  });

  it('goes back from an app’s details to the list as it was filtered', async () => {
    setUp();

    const prefix = faker.string.alpha({ length: 8, casing: 'lower' });

    const apps = [1, 2].map((rank) =>
      buildSkThirdPartyApp({
        store: 'appstore',
        region: 'SG',
        risk_status: RISK.HIGH,
        package_name: `com.${prefix}.${rank}`,
      })
    );

    mockSkThirdPartyApps(apps);
    mockSkThirdPartyApp(apps[1]);

    const { router } = await renderAtRoute(
      `${THIRD_PARTY}?tp_store=appstore&tp_region=SG&tp_risk_status=${RISK.HIGH}&tp_filter=${prefix}&tp_limit=10&tp_offset=1`
    );

    await userEvent.click(await screen.findByText(apps[1].package_name));

    await userEvent.click(
      within(
        await screen.findByRole('navigation', { name: akMT('storeknox.thirdPartyScansTitle') })
      ).getByRole('link', { name: akMT('storeknox.thirdPartyScansTitle') })
    );

    await waitFor(() => expect(router.state.location.pathname).toBe(THIRD_PARTY));

    expect(router.state.location.search).toEqual({
      tp_store: 'appstore',
      tp_region: 'SG',
      tp_risk_status: RISK.HIGH,
      tp_filter: prefix,
      tp_limit: 10,
      tp_offset: 1,
    });

    expect(await screen.findByRole('textbox', { name: akMT('searchQuery') })).toHaveValue(prefix);
  });

  it('keeps the page and history when a search is cleared before it fires', async () => {
    setUp();

    const apps = Array.from({ length: 12 }, () =>
      buildSkThirdPartyApp({ store: 'appstore', region: 'US' })
    );

    const received = mockSkThirdPartyApps(apps);

    const { router } = await renderAtRoute(
      `${THIRD_PARTY}?tp_store=appstore&tp_region=US&tp_offset=10`
    );

    const box = await screen.findByRole('textbox', { name: akMT('searchQuery') });

    await screen.findByText(apps[10].package_name);

    const entries = router.history.length;

    await userEvent.type(box, 'abc');
    await userEvent.click(screen.getByRole('button', { name: akMT('clear') }));
    await pastDebounce();

    expect(box).toHaveValue('');
    expect(router.state.location.search).toMatchObject({ tp_offset: 10 });
    expect(router.history.length).toBe(entries);
    expect(received.filter((params) => params.has('filter'))).toHaveLength(0);
  });

  it('searches once for text with spaces around it', async () => {
    setUp();

    const app = buildSkThirdPartyApp({ store: 'appstore', region: 'US' });
    const received = mockSkThirdPartyApps([app]);

    const { router } = await renderAtRoute(`${THIRD_PARTY}?tp_store=appstore&tp_region=US`);

    await screen.findByText(app.package_name);

    const entries = router.history.length;

    await userEvent.type(
      screen.getByRole('textbox', { name: akMT('searchQuery') }),
      ` ${app.package_name} `
    );

    await waitFor(
      () => expect(router.state.location.search).toMatchObject({ tp_filter: app.package_name }),
      SEARCH_WAIT
    );

    await pastDebounce();

    expect(router.history.length).toBe(entries + 1);
    expect(received.filter((params) => params.has('filter'))).toHaveLength(1);
  });
});
