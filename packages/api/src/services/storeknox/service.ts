import { ENUMS } from '@irene/enums';

import {
  OrganizationEndpoints,
  type ApiStoreknoxOrganization,
} from '@irene/api/services/organization';

import { tagRecordForCaching } from '@irene/api/normalization';
import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';
import { FileEndpoints } from '@irene/api/services/file';
import { SubmissionEndpoints, type ApiSubmission } from '@irene/api/services/submission';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import { StoreknoxEndpoints } from './endpoints';

import type {
  ApiSkAddToInventoryRequest,
  ApiSkApp,
  ApiSkAppListRequest,
  ApiSkApprovalStatus,
  ApiSkApprovalStatusResponse,
  ApiSkAppVersion,
  ApiSkAppVersionListRequest,
  ApiSkCoreFile,
  ApiSkDiscoveryResult,
  ApiSkDiscoveryResultsRequest,
  ApiSkDiscoverySearch,
  ApiSkFakeApp,
  ApiSkFakeAppInventoryRequest,
  ApiSkFakeAppReviewResponse,
  ApiSkFakeAppsRequest,
  ApiSkFileRisk,
  ApiSkInitiateUploadResponse,
  ApiSkInventoryApp,
  ApiSkMonitoringStatusResponse,
  ApiSkOrganizationSettingsRequest,
  ApiSkOrganizationUser,
  ApiSkRequestedApp,
  ApiSkSubscription,
} from './types';

/** Talks to the StoreKnox inventory endpoints. */
export default class StoreknoxService {
  /** Fetches a page of the inventory, or of the apps waiting to join it. */
  public static readonly getApps = async (params: ApiSkAppListRequest) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiSkApp>>(StoreknoxEndpoints.apps(), {
      params,
    });

    return transformPaginatedResponse(page);
  };

  /** Fetches one app for its details page; it blocks the page, so it aborts after the standard timeout. */
  public static readonly getInventoryApp = (appId: number | string) =>
    apiRequest.get<ApiSkInventoryApp>(StoreknoxEndpoints.appDetail(appId), {
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });

  /** Approves or rejects an app someone asked to add. */
  public static readonly updateApprovalStatus = (
    appId: number | string,
    approvalStatus: ApiSkApprovalStatus
  ) =>
    apiRequest.put<ApiSkApprovalStatusResponse>(StoreknoxEndpoints.approvalStatus(appId), {
      approval_status: approvalStatus,
    });

  /** Turns store monitoring on or off for one app. */
  public static readonly updateMonitoring = (appId: number | string, monitoringEnabled: boolean) =>
    apiRequest.put<ApiSkMonitoringStatusResponse>(StoreknoxEndpoints.monitoringStatus(appId), {
      monitoring_enabled: monitoringEnabled,
    });

  /** Archives an active app, or restores an archived one, depending on its current `app_status`. */
  public static readonly toggleArchiveStatus = (app: Pick<ApiSkApp, 'id' | 'app_status'>) =>
    apiRequest.put<unknown>(StoreknoxEndpoints.appStatus(app.id), {
      app_status:
        app.app_status === ENUMS.SK_APP_STATUS.ARCHIVED
          ? ENUMS.SK_APP_STATUS.ACTIVE
          : ENUMS.SK_APP_STATUS.ARCHIVED,
    });

  /** Asks the server to fetch an app's latest store build and upload it. */
  public static readonly initiateAppUpload = (appId: number | string) =>
    apiRequest.post<ApiSkInitiateUploadResponse>(StoreknoxEndpoints.appUpload(appId));

  /** Fetches the store versions seen for one app: the latest only, or a page of the history. */
  public static readonly getAppVersions = async (
    appId: number | string,
    params: ApiSkAppVersionListRequest
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiSkAppVersion>>(
      StoreknoxEndpoints.appVersions(appId),
      { params }
    );

    return transformPaginatedResponse(page);
  };

  /** Fetches one store version, to learn whether an upload can start for it. */
  public static readonly getAppVersion = (versionId: number | string) =>
    apiRequest.get<ApiSkAppVersion>(StoreknoxEndpoints.appVersion(versionId));

  /** Asks the server to fetch one store version and upload it. */
  public static readonly initiateAppVersionUpload = (versionId: number | string) =>
    apiRequest.post<ApiSkInitiateUploadResponse>(StoreknoxEndpoints.appVersionUpload(versionId));

  /** Switches one of the StoreKnox organization's inventory settings. */
  public static readonly updateOrganizationSettings = (
    organizationId: number | string,
    settings: ApiSkOrganizationSettingsRequest
  ) =>
    apiRequest.patch<ApiStoreknoxOrganization>(
      StoreknoxEndpoints.organization(organizationId),
      settings
    );

  /** Fetches the StoreKnox organization's subscription. */
  public static readonly getSubscription = (organizationId: number | string) =>
    apiRequest.get<ApiSkSubscription>(StoreknoxEndpoints.subscription(organizationId));

  /** Tells support the organization wants more monitoring licences. */
  public static readonly requestCredits = () =>
    apiRequest.post<unknown>(StoreknoxEndpoints.creditRequest());

  /** Fetches one upload, tagged so a pushed status reaches every query holding it. */
  public static readonly getSubmission = async (submissionId: number | string) =>
    tagRecordForCaching(
      'submission',
      await apiRequest.get<ApiSubmission>(SubmissionEndpoints.detail(submissionId))
    );

  /**
   * Fetches one Appknox file, tagged so the pushes sent as its scans finish reach it.
   * A 404 means the account cannot see it.
   */
  public static readonly getFile = async (fileId: number | string) =>
    tagRecordForCaching('file', await apiRequest.get<ApiSkCoreFile>(FileEndpoints.detail(fileId)));

  /** Fetches one file's finding counts by severity, tagged so a pushed recount reaches it. */
  public static readonly getFileRisk = async (fileId: number | string) =>
    tagRecordForCaching(
      'file-risk',
      await apiRequest.get<ApiSkFileRisk>(FileEndpoints.risk(fileId))
    );

  /** Fetches one member of an organization. */
  public static readonly getOrganizationUser = (
    organizationId: number | string,
    userId: number | string
  ) => apiRequest.get<ApiSkOrganizationUser>(OrganizationEndpoints.user(organizationId, userId));

  /** Starts a store search; its results are then read by the id the server returns. */
  public static readonly createDiscoverySearch = (query: string) =>
    apiRequest.post<ApiSkDiscoverySearch>(StoreknoxEndpoints.discovery(), { query_str: query });

  /** Fetches a page of what one store search found. */
  public static readonly getDiscoveryResults = async (
    searchId: number | string,
    params: ApiSkDiscoveryResultsRequest
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiSkDiscoveryResult>>(
      StoreknoxEndpoints.discoveryResults(searchId),
      { params }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Asks whether a store listing is in the inventory or awaiting approval; the
   * server answers 404 for a listing that is neither.
   */
  public static readonly checkApprovalStatus = (docUlid: string) =>
    apiRequest.get<ApiSkApprovalStatusResponse>(StoreknoxEndpoints.approvalStatusCheck(), {
      params: { doc_ulid: docUlid },
    });

  /** Adds a store listing to the inventory; an owner's addition is approved at once, anyone else's waits for an owner. */
  public static readonly addAppToInventory = (request: ApiSkAddToInventoryRequest) =>
    apiRequest.post<ApiSkApp>(StoreknoxEndpoints.apps(), request);

  /** Fetches a page of the apps the signed-in member has asked to add. */
  public static readonly getRequestedApps = async (params: ApiSkDiscoveryResultsRequest) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiSkRequestedApp>>(
      StoreknoxEndpoints.requestedApps(),
      { params }
    );

    return transformPaginatedResponse(page);
  };

  /** Fetches a page of the inventory apps fake-app detection can list copies for, searched by `q`. */
  public static readonly getFakeAppInventory = async (params: ApiSkFakeAppInventoryRequest) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiSkApp>>(
      StoreknoxEndpoints.fakeAppInventory(),
      { params }
    );

    return transformPaginatedResponse(page);
  };

  /** Fetches a page of the copies found of one inventory app; `classification` is left out for the ignored list. */
  public static readonly getFakeApps = async (
    skAppId: number | string,
    params: ApiSkFakeAppsRequest
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiSkFakeApp>>(
      StoreknoxEndpoints.fakeApps(skAppId),
      { params }
    );

    return transformPaginatedResponse(page);
  };

  /** Fetches one copy beneath its inventory app, which the path needs. */
  public static readonly getFakeApp = (skAppId: number | string, id: number | string) =>
    apiRequest.get<ApiSkFakeApp>(StoreknoxEndpoints.fakeApp(skAppId, id));

  /** Dismisses a copy as not a threat, with the reviewer's reason. */
  public static readonly ignoreFakeApp = (
    skAppId: number | string,
    id: number | string,
    reason: string
  ) =>
    apiRequest.post<ApiSkFakeAppReviewResponse>(StoreknoxEndpoints.ignoreFakeApp(skAppId, id), {
      ignore_reason: reason,
    });

  /** Dismisses a copy and adds its store listing to the inventory, with the reviewer's reason. */
  public static readonly addFakeAppToInventory = (
    skAppId: number | string,
    id: number | string,
    reason: string
  ) =>
    apiRequest.post<ApiSkFakeAppReviewResponse>(
      StoreknoxEndpoints.addFakeAppToInventory(skAppId, id),
      { ignore_reason: reason }
    );
}
