import { http, HttpResponse } from 'msw';

import {
  OrganizationEndpoints,
  type ApiStoreknoxOrganization,
} from '@irene/api/services/organization';

import {
  StoreknoxEndpoints,
  type ApiSkApp,
  type ApiSkAppVersion,
  type ApiSkInventoryApp,
  type ApiSkSubscription,
} from '@irene/api/services/storeknox';

import { storeSession } from '@irene/api/utils/session';
import { ENUMS } from '@irene/enums';

import { buildSession, buildSkSubscription, buildStoreknoxOrganization } from '@tests/factories';
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
export function mockStoreknoxOrganization(overrides: Partial<ApiStoreknoxOrganization> = {}) {
  const organization = buildStoreknoxOrganization(overrides);

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
