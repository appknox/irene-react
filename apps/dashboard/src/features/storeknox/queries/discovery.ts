import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { StoreknoxService } from '@irene/api/services/storeknox';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { storeknoxKeys, type SkAppListPage } from '@/features/storeknox/queries/inventory';

/** The cache keys for StoreKnox discovery, beneath the module's own. */
export const skDiscoveryKeys = {
  all: () => [...storeknoxKeys.all(), 'discovery'] as const,

  results: (searchId: string, page: SkAppListPage) =>
    [...skDiscoveryKeys.all(), 'results', searchId, page] as const,

  approvalCheck: (docUlid: string) =>
    [...skDiscoveryKeys.all(), 'approval-check', docUlid] as const,

  requestedAppsAll: () => [...skDiscoveryKeys.all(), 'requested-apps'] as const,

  requestedApps: (page: SkAppListPage) => [...skDiscoveryKeys.requestedAppsAll(), page] as const,
};

/** A page of one store search's results; the page shown stays while the next loads. */
export const skDiscoveryResultsOptions = (searchId: string, page: SkAppListPage) =>
  queryOptions({
    queryKey: skDiscoveryKeys.results(searchId, page),
    queryFn: () => StoreknoxService.getDiscoveryResults(searchId, page),
    placeholderData: keepPreviousData,
  });

/**
 * Whether a store listing is already in the inventory or awaiting a decision; the
 * server's 404 for neither resolves to `null`, which irene reads as "not requested".
 */
export const skApprovalCheckOptions = (docUlid: string) =>
  queryOptions({
    queryKey: skDiscoveryKeys.approvalCheck(docUlid),
    queryFn: async () => {
      try {
        return await StoreknoxService.checkApprovalStatus(docUlid);
      } catch (error) {
        if (getApiErrorStatus(error) === HTTP_STATUS_CODES.NOT_FOUND) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
  });

/** A page of the apps the signed-in member has asked to add. */
export const skRequestedAppsOptions = (page: SkAppListPage) =>
  queryOptions({
    queryKey: skDiscoveryKeys.requestedApps(page),
    queryFn: () => StoreknoxService.getRequestedApps(page),
    placeholderData: keepPreviousData,
  });
