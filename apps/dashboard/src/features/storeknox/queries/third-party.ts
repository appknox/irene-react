import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import {
  StoreknoxService,
  type ApiSkThirdPartyAppRequest,
  type ApiSkThirdPartyAppsRequest,
} from '@irene/api/services/storeknox';

import { storeknoxKeys } from '@/features/storeknox/queries/inventory';

/** The cache keys for StoreKnox third-party scans, beneath the module's own. */
export const skThirdPartyKeys = {
  all: () => [...storeknoxKeys.all(), 'third-party'] as const,
  config: () => [...skThirdPartyKeys.all(), 'config'] as const,
  listAll: () => [...skThirdPartyKeys.all(), 'list'] as const,
  list: (params: ApiSkThirdPartyAppsRequest) => [...skThirdPartyKeys.listAll(), params] as const,

  /* Keyed on the package name with its store, region and version: the same package scans
     differently in each, so one entry per package would show another region's findings. */
  app: (params: ApiSkThirdPartyAppRequest) =>
    [
      ...skThirdPartyKeys.all(),
      'app',
      params.q,
      params.store,
      params.region,
      params.version ?? null,
    ] as const,
};

/** Which regions each store is scanned in; it changes only when the deployment does, so it is fetched once. */
export const skThirdPartyConfigOptions = () =>
  queryOptions({
    queryKey: skThirdPartyKeys.config(),
    queryFn: () => StoreknoxService.getThirdPartyConfig(),
    staleTime: Infinity,
    gcTime: Infinity,
  });

/**
 * A page of third-party apps; the page shown stays while the next loads. `enabled` is false when
 * no store has a region, since there is nothing to ask for.
 */
export const skThirdPartyAppsOptions = (
  params: ApiSkThirdPartyAppsRequest,
  { enabled = true }: { enabled?: boolean } = {}
) =>
  queryOptions({
    queryKey: skThirdPartyKeys.list(params),
    queryFn: () => StoreknoxService.getThirdPartyApps(params),
    placeholderData: keepPreviousData,
    enabled,
  });

/** One third-party app with its findings, for a store, region and scanned version. */
export const skThirdPartyAppOptions = (params: ApiSkThirdPartyAppRequest) =>
  queryOptions({
    queryKey: skThirdPartyKeys.app(params),
    queryFn: () => StoreknoxService.getThirdPartyApp(params),
  });
