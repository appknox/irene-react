import { http, HttpResponse } from 'msw';

import {
  OrganizationEndpoints,
  type ApiStoreknoxOrganization,
} from '@irene/api/services/organization';

import {
  StoreknoxEndpoints,
  type ApiSkApp,
  type ApiSkApprovalStatus,
  type ApiSkAppVersion,
  type ApiSkDiscoveryResult,
  type ApiSkFakeApp,
  type ApiSkFakeAppReviewResponse,
  type ApiSkInventoryApp,
  type ApiSkRequestedApp,
  type ApiSkSubscription,
  type ApiSkThirdPartyApp,
  type ApiSkThirdPartyConfig,
} from '@irene/api/services/storeknox';

import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';

import {
  buildSession,
  buildSkDiscoverySearch,
  buildSkSubscription,
  buildStoreknoxOrganization,
} from '@tests/factories';

import { riskStatusLabel } from '@/features/storeknox/utils/third-party';
import { mockOrganizationFeatures, mockOrganizationMe } from '@tests/organization';
import { buildAPITestURL, server } from '@tests/server';

const page = <T>(results: T[], count = results.length) => ({
  count,
  next: null,
  previous: null,
  results,
});

/** Signs in to an organization with StoreKnox, as a plain member unless `role` says otherwise. */
export function signInToStoreknox(role: { is_owner?: boolean; is_admin?: boolean } = {}) {
  storeSession(buildSession());
  mockOrganizationFeatures({ storeknox: true });
  mockOrganizationMe({ is_owner: false, is_admin: false, ...role });
}

/** Answers the StoreKnox organization endpoint with one organization, and returns it. */
export function mockStoreknoxOrganization(
  overrides: Partial<Omit<ApiStoreknoxOrganization, 'sk_features'>> & {
    sk_features?: Partial<ApiStoreknoxOrganization['sk_features']>;
  } = {}
) {
  const base = buildStoreknoxOrganization();

  const organization = {
    ...base,
    ...overrides,
    sk_features: { ...base.sk_features, ...overrides.sk_features },
  };

  server.use(
    http.get(buildAPITestURL(OrganizationEndpoints.storeknoxOrganization()), () =>
      HttpResponse.json(page([organization]))
    )
  );

  return organization;
}

interface SkAppLists {
  inventory?: ApiSkApp[];
  inventoryCount?: number;
  pending?: ApiSkApp[];
  archived?: ApiSkApp[];
}

/**
 * Answers the inventory's list endpoint, telling the lists apart by their approval and app status filters.
 *
 * @returns The query strings received, newest last.
 */
export function mockSkAppLists(lists: SkAppLists = {}) {
  const received: URLSearchParams[] = [];

  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.apps()), ({ request }) => {
      const params = new URL(request.url).searchParams;
      const approval = Number(params.get('approval_status'));
      const appStatus = params.get('app_status');

      received.push(params);

      if (approval === ENUMS.SK_APPROVAL_STATUS.PENDING_APPROVAL) {
        return HttpResponse.json(page(lists.pending ?? []));
      }

      if (appStatus === String(ENUMS.SK_APP_STATUS.ARCHIVED)) {
        return HttpResponse.json(page(lists.archived ?? []));
      }

      const inventory = lists.inventory ?? [];

      return HttpResponse.json(page(inventory, lists.inventoryCount ?? inventory.length));
    })
  );

  return received;
}

export function mockSkInventoryApp(app: ApiSkInventoryApp) {
  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.appDetail(app.id)), () => HttpResponse.json(app))
  );
}

/** Answers the subscription endpoint for any organization, and returns the subscription. */
export function mockSkSubscription(overrides: Partial<ApiSkSubscription> = {}) {
  const subscription = buildSkSubscription(overrides);

  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.subscription('*')), () =>
      HttpResponse.json(subscription)
    )
  );

  return subscription;
}

/** Answers an app's store versions, the latest or the history by `is_latest`. */
export function mockSkAppVersions(
  appId: number,
  versions: { latest?: ApiSkAppVersion[]; history?: ApiSkAppVersion[]; historyCount?: number }
) {
  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.appVersions(appId)), ({ request }) => {
      const isLatest = new URL(request.url).searchParams.get('is_latest') === 'true';
      const rows = (isLatest ? versions.latest : versions.history) ?? [];

      return HttpResponse.json(
        page(rows, isLatest ? rows.length : (versions.historyCount ?? rows.length))
      );
    })
  );
}

/**
 * Answers the store search and its results; a listing not in `statuses` (keyed by ulid) answers 404, neither in the inventory nor requested.
 *
 * @returns The search served, and the query and result params it was sent.
 */
export function mockSkDiscovery(
  results: ApiSkDiscoveryResult[] = [],
  statuses: Record<string, ApiSkApprovalStatus> = {}
) {
  const search = buildSkDiscoverySearch();
  const sent: { query?: string; resultParams: URLSearchParams[] } = { resultParams: [] };

  server.use(
    http.post(buildAPITestURL(StoreknoxEndpoints.discovery()), async ({ request }) => {
      const body = (await request.json()) as { query_str: string };

      sent.query = body.query_str;

      return HttpResponse.json({ ...search, query_str: body.query_str });
    }),

    http.get(buildAPITestURL(StoreknoxEndpoints.discoveryResults(search.id)), ({ request }) => {
      sent.resultParams.push(new URL(request.url).searchParams);

      return HttpResponse.json(page(results));
    }),

    http.get(buildAPITestURL(StoreknoxEndpoints.approvalStatusCheck()), ({ request }) => {
      const docUlid = new URL(request.url).searchParams.get('doc_ulid') ?? '';
      const status = statuses[docUlid];

      if (status === undefined) {
        return HttpResponse.json(
          { detail: 'App not found in organization inventory.' },
          { status: HTTP_STATUS_CODES.NOT_FOUND }
        );
      }

      return HttpResponse.json({ id: 1, approval_status: status, approval_status_display: '' });
    })
  );

  return { search, sent };
}

export function mockSkRequestedApps(requests: ApiSkRequestedApp[] = []) {
  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.requestedApps()), () =>
      HttpResponse.json(page(requests))
    )
  );
}

/**
 * Answers the fake-app inventory with these apps, keeping the apps whose package name contains `q`
 * (case-insensitive), then paginating by `limit` and `offset`.
 */
export function mockSkFakeAppInventory(apps: ApiSkApp[] = []) {
  const received: URLSearchParams[] = [];

  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.fakeAppInventory()), ({ request }) => {
      const params = new URL(request.url).searchParams;
      const q = (params.get('q') ?? '').toLowerCase();

      const matching = apps.filter((app) =>
        app.app_metadata.package_name.toLowerCase().includes(q)
      );

      const limit = Number(params.get('limit') ?? matching.length);
      const offset = Number(params.get('offset') ?? 0);

      received.push(params);

      return HttpResponse.json(page(matching.slice(offset, offset + limit), matching.length));
    })
  );

  return received;
}

interface SkFakeAppLists {
  brandAbuse?: ApiSkFakeApp[];
  fakeApp?: ApiSkFakeApp[];
  ignored?: ApiSkFakeApp[];
}

/**
 * Answers an app's fake-app list, telling the tabs apart by the request's `status` and
 * `classification`, and paginating by `limit` and `offset`.
 *
 * @returns The query strings received, newest last.
 */
export function mockSkFakeApps(skAppId: number, lists: SkFakeAppLists = {}) {
  const received: URLSearchParams[] = [];

  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.fakeApps(skAppId)), ({ request }) => {
      const params = new URL(request.url).searchParams;
      const classification = params.get('classification');
      let rows = lists.ignored ?? [];

      if (params.get('status') !== 'ignored') {
        rows = (classification === 'brand_abuse' ? lists.brandAbuse : lists.fakeApp) ?? [];
      }

      const limit = Number(params.get('limit') ?? rows.length);
      const offset = Number(params.get('offset') ?? 0);

      received.push(params);

      return HttpResponse.json(page(rows.slice(offset, offset + limit), rows.length));
    })
  );

  return received;
}

/** Answers one suspected copy's detail. */
export function mockSkFakeApp(skAppId: number, app: ApiSkFakeApp) {
  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.fakeApp(skAppId, app.id)), () =>
      HttpResponse.json(app)
    )
  );
}

/**
 * Answers ignoring a copy or adding it to the inventory with `response`.
 *
 * @returns The request bodies received, newest last.
 */
export function mockSkFakeAppReview(
  skAppId: number,
  id: number,
  kind: 'ignore' | 'add-to-inventory',
  response: ApiSkFakeAppReviewResponse
) {
  const bodies: unknown[] = [];

  const url =
    kind === 'ignore'
      ? StoreknoxEndpoints.ignoreFakeApp(skAppId, id)
      : StoreknoxEndpoints.addFakeAppToInventory(skAppId, id);

  server.use(
    http.post(buildAPITestURL(url), async ({ request }) => {
      bodies.push(await request.json());

      return HttpResponse.json(response);
    })
  );

  return bodies;
}

/** Answers the third-party scan config with one config. */
export function mockSkThirdPartyConfig(config: ApiSkThirdPartyConfig) {
  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.thirdPartyConfig()), () =>
      HttpResponse.json(config)
    )
  );
}

/**
 * Answers the third-party apps list, keeping the apps whose package name contains `filter`
 * (case-insensitive) and whose risk status is the `risk_status` word, then paginating by `limit`
 * and `offset`. A request with `q` is a single app's, left to `mockSkThirdPartyApp`.
 *
 * @returns The query strings received, newest last.
 */
export function mockSkThirdPartyApps(apps: ApiSkThirdPartyApp[] = []) {
  const received: URLSearchParams[] = [];

  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.thirdPartyApps()), ({ request }) => {
      const params = new URL(request.url).searchParams;

      if (params.has('q')) {
        return undefined;
      }

      const filter = (params.get('filter') ?? '').toLowerCase();
      const risk = params.get('risk_status');

      const matching = apps.filter(
        (app) =>
          app.package_name.toLowerCase().includes(filter) &&
          (risk === null || riskStatusLabel(app.risk_status) === risk)
      );

      const limit = Number(params.get('limit') ?? matching.length);
      const offset = Number(params.get('offset') ?? 0);

      received.push(params);

      return HttpResponse.json(page(matching.slice(offset, offset + limit), matching.length));
    })
  );

  return received;
}

/**
 * Answers one third-party app: the app whose package name is `q` and whose store, region and
 * version match the request (a request without `version` gets the app's own). Anything else is a 404.
 *
 * @returns The query strings received, newest last.
 */
export function mockSkThirdPartyApp(app: ApiSkThirdPartyApp) {
  const received: URLSearchParams[] = [];

  server.use(
    http.get(buildAPITestURL(StoreknoxEndpoints.thirdPartyApps()), ({ request }) => {
      const params = new URL(request.url).searchParams;

      if (!params.has('q')) {
        return undefined;
      }

      received.push(params);

      const matches =
        params.get('q') === app.package_name &&
        params.get('store') === app.store &&
        params.get('region') === app.region &&
        (params.get('version') ?? app.version) === app.version;

      return matches
        ? HttpResponse.json(app)
        : HttpResponse.json({ detail: 'Not found.' }, { status: HTTP_STATUS_CODES.NOT_FOUND });
    })
  );

  return received;
}
