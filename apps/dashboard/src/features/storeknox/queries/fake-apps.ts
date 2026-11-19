import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import {
  StoreknoxService,
  type ApiSkFakeAppInventoryRequest,
  type ApiSkFakeAppsRequest,
} from '@irene/api/services/storeknox';

import { storeknoxKeys } from '@/features/storeknox/queries/inventory';

/** The cache keys for StoreKnox fake-app detection, beneath the module's own. */
export const skFakeAppKeys = {
  all: () => [...storeknoxKeys.all(), 'fake-apps'] as const,

  /* Beneath the inventory's `apps` key, so a review or an addition that invalidates it refreshes
     the listing's totals. */
  inventory: (params: ApiSkFakeAppInventoryRequest) =>
    [...storeknoxKeys.apps(), 'fake-app-inventory', params] as const,

  /* Every tab's list for one inventory app, so a review refreshes all three counts at once. */
  listsFor: (skAppId: number | string) =>
    [...skFakeAppKeys.all(), 'list', String(skAppId)] as const,

  list: (skAppId: number | string, params: ApiSkFakeAppsRequest) =>
    [...skFakeAppKeys.listsFor(skAppId), params] as const,

  detail: (skAppId: number | string, id: number | string) =>
    [...skFakeAppKeys.all(), 'detail', String(skAppId), String(id)] as const,
};

/**
 * A page of the inventory apps fake-app detection reports on; the page shown stays while the next
 * loads.
 */
export const skFakeAppInventoryOptions = (params: ApiSkFakeAppInventoryRequest) =>
  queryOptions({
    queryKey: skFakeAppKeys.inventory(params),
    queryFn: () => StoreknoxService.getFakeAppInventory(params),
    placeholderData: keepPreviousData,
  });

/** A page of one app's suspected copies for a status and classification. */
export const skFakeAppsOptions = (skAppId: number | string, params: ApiSkFakeAppsRequest) =>
  queryOptions({
    queryKey: skFakeAppKeys.list(skAppId, params),
    queryFn: () => StoreknoxService.getFakeApps(skAppId, params),
    placeholderData: keepPreviousData,
  });

/** One suspected copy with the AI's findings. */
export const skFakeAppOptions = (skAppId: number | string, id: number | string) =>
  queryOptions({
    queryKey: skFakeAppKeys.detail(skAppId, id),
    queryFn: () => StoreknoxService.getFakeApp(skAppId, id),
  });

/** The tabs of a fake-app listing: the AI's two classifications and the ignored copies. */
export type FakeAppTab = 'brand-abuse' | 'fake-app' | 'ignored';

/**
 * The status and classification each tab asks the server for; the ignored list is not split by
 * classification.
 */
export function fakeAppTabQuery(
  tab: FakeAppTab
): Pick<ApiSkFakeAppsRequest, 'status' | 'classification'> {
  switch (tab) {
    case 'brand-abuse':
      return { status: 'pending', classification: 'brand_abuse' };
    case 'fake-app':
      return { status: 'pending', classification: 'fake_app' };
    case 'ignored':
      return { status: 'ignored' };
  }
}
