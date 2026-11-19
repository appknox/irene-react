import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { StoreknoxService, type ApiSkMonitoringStatusFilter } from '@irene/api/services/storeknox';
import { ENUMS } from '@irene/enums';

/* Every list keeps its page while the next loads, so the table does not flash back to skeleton rows. */

/** A page of one of the inventory's lists. */
export interface SkAppListPage {
  limit: number;
  offset: number;
}

/** The inventory list's page and its monitoring filter, `-1` for every state. */
export interface SkInventoryListParams extends SkAppListPage {
  monitoringStatus: ApiSkMonitoringStatusFilter | -1;
}

/** The cache keys for the StoreKnox inventory. */
export const storeknoxKeys = {
  all: () => ['storeknox'] as const,
  apps: () => [...storeknoxKeys.all(), 'apps'] as const,
  inventory: (params: SkInventoryListParams) =>
    [...storeknoxKeys.apps(), 'inventory', params] as const,
  pendingReview: (page: SkAppListPage) =>
    [...storeknoxKeys.apps(), 'pending-review', page] as const,
  archived: (page: SkAppListPage) => [...storeknoxKeys.apps(), 'archived', page] as const,
  inventoryApp: (appId: number | string) =>
    [...storeknoxKeys.all(), 'inventory-app', String(appId)] as const,

  appVersionsOf: (appId: number | string) =>
    [...storeknoxKeys.all(), 'app-versions', String(appId)] as const,
  appVersions: (appId: number | string, isHistory: boolean, page: SkAppListPage) =>
    [...storeknoxKeys.appVersionsOf(appId), isHistory, page] as const,

  subscription: (organizationId: number | string) =>
    [...storeknoxKeys.all(), 'subscription', organizationId] as const,

  submission: (submissionId: number | string) =>
    [...storeknoxKeys.all(), 'submission', submissionId] as const,

  files: () => [...storeknoxKeys.all(), 'file'] as const,
  file: (fileId: number | string) => [...storeknoxKeys.files(), fileId] as const,
  fileRisks: () => [...storeknoxKeys.all(), 'file-risk'] as const,
  fileRisk: (fileId: number | string) => [...storeknoxKeys.fileRisks(), fileId] as const,

  organizationUser: (organizationId: number | string, userId: number | string) =>
    [...storeknoxKeys.all(), 'organization-user', organizationId, userId] as const,
};

/** The inventory: approved apps that are active or decommissioned; a `-1` filter sends none. */
export const skInventoryAppsOptions = (params: SkInventoryListParams) =>
  queryOptions({
    queryKey: storeknoxKeys.inventory(params),
    placeholderData: keepPreviousData,
    queryFn: () =>
      StoreknoxService.getApps({
        limit: params.limit,
        offset: params.offset,
        approval_status: ENUMS.SK_APPROVAL_STATUS.APPROVED,
        app_status: `${ENUMS.SK_APP_STATUS.ACTIVE},${ENUMS.SK_APP_STATUS.DECOMMISSIONED}`,
        ...(params.monitoringStatus !== -1 && { monitoring_status: params.monitoringStatus }),
      }),
  });

/** The apps waiting for an owner's decision. */
export const skPendingReviewAppsOptions = (page: SkAppListPage) =>
  queryOptions({
    queryKey: storeknoxKeys.pendingReview(page),
    placeholderData: keepPreviousData,
    queryFn: () =>
      StoreknoxService.getApps({
        ...page,
        approval_status: ENUMS.SK_APPROVAL_STATUS.PENDING_APPROVAL,
        app_status: String(ENUMS.SK_APP_STATUS.ACTIVE),
      }),
  });

/** The archived apps. */
export const skArchivedAppsOptions = (page: SkAppListPage) =>
  queryOptions({
    queryKey: storeknoxKeys.archived(page),
    placeholderData: keepPreviousData,
    queryFn: () =>
      StoreknoxService.getApps({
        ...page,
        approval_status: ENUMS.SK_APPROVAL_STATUS.APPROVED,
        app_status: String(ENUMS.SK_APP_STATUS.ARCHIVED),
      }),
  });

/** One inventory app's details. */
export const skInventoryAppOptions = (appId: number | string) =>
  queryOptions({
    queryKey: storeknoxKeys.inventoryApp(appId),
    queryFn: () => StoreknoxService.getInventoryApp(appId),
  });

/**
 * An app's store versions: the latest only, or a page of its history.
 *
 * @param page - Sent for the history only.
 */
export const skAppVersionsOptions = (
  appId: number | string,
  isHistory: boolean,
  page: SkAppListPage
) =>
  queryOptions({
    queryKey: storeknoxKeys.appVersions(appId, isHistory, page),
    placeholderData: keepPreviousData,
    queryFn: () =>
      StoreknoxService.getAppVersions(appId, {
        is_latest: !isHistory,
        ...(isHistory && page),
      }),
  });

/** The StoreKnox organization's subscription, never fresh so the licences left are current. */
export const skSubscriptionOptions = (organizationId: number | string) =>
  queryOptions({
    queryKey: storeknoxKeys.subscription(organizationId),
    queryFn: () => StoreknoxService.getSubscription(organizationId),
    staleTime: 0,
  });

/** One upload; not retried, since a 404 means the account cannot see it. */
export const skSubmissionOptions = (submissionId: number | string) =>
  queryOptions({
    queryKey: storeknoxKeys.submission(submissionId),
    queryFn: () => StoreknoxService.getSubmission(submissionId),
    retry: false,
  });

/** One Appknox file; not retried, since a 404 means the account cannot see it. */
export const skFileOptions = (fileId: number | string) =>
  queryOptions({
    queryKey: storeknoxKeys.file(fileId),
    queryFn: () => StoreknoxService.getFile(fileId),
    retry: false,
  });

/** One file's finding counts. */
export const skFileRiskOptions = (fileId: number | string) =>
  queryOptions({
    queryKey: storeknoxKeys.fileRisk(fileId),
    queryFn: () => StoreknoxService.getFileRisk(fileId),
  });

/** The member who asked for an app. */
export const skOrganizationUserOptions = (
  organizationId: number | string,
  userId: number | string
) =>
  queryOptions({
    queryKey: storeknoxKeys.organizationUser(organizationId, userId),
    queryFn: () => StoreknoxService.getOrganizationUser(organizationId, userId),
    staleTime: Infinity,
  });
