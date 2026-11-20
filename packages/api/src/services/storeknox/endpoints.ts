import { API_NAMESPACES } from '@irene/api/namespaces';

const _segment = (value: number | string) => encodeURIComponent(value);

/** Paths for the StoreKnox inventory: the apps an organization watches on the stores. */
export const StoreknoxEndpoints = {
  /** The inventory, filtered by approval and app status; also where an app is added. */
  apps: () => `${API_NAMESPACES.v2}/sk_app` as const,

  /** Approves or rejects an app someone asked to add. */
  approvalStatus: (appId: number | string) =>
    `${API_NAMESPACES.v2}/sk_app/${_segment(appId)}/update_approval_status` as const,

  /** Turns store monitoring on or off for one app. */
  monitoringStatus: (appId: number | string) =>
    `${API_NAMESPACES.v2}/sk_app/${_segment(appId)}/update_monitoring_enabled_status` as const,

  /** Archives or restores one app. */
  appStatus: (appId: number | string) =>
    `${API_NAMESPACES.v2}/sk_app/${_segment(appId)}/update_app_status` as const,

  /** Asks the server to fetch an app's latest store build and upload it to Appknox. */
  appUpload: (appId: number | string) =>
    `${API_NAMESPACES.v2}/sk_app/${_segment(appId)}/sk_app_upload` as const,

  /** One app with what its details page needs: its Appknox project, upload and errors. */
  appDetail: (appId: number | string) =>
    `${API_NAMESPACES.v2}/sk_app_detail/${_segment(appId)}` as const,

  /** The store versions seen for one app, latest only or the full history. */
  appVersions: (appId: number | string) =>
    `${API_NAMESPACES.v2}/sk_app/${_segment(appId)}/sk_app_version` as const,

  /** One store version. */
  appVersion: (versionId: number | string) =>
    `${API_NAMESPACES.v2}/sk_app_versions/${_segment(versionId)}` as const,

  /** Asks the server to fetch one store version and upload it to Appknox. */
  appVersionUpload: (versionId: number | string) =>
    `${API_NAMESPACES.v2}/sk_app_versions/${_segment(versionId)}/sk_initiate_upload` as const,

  /** The StoreKnox organization's inventory settings. */
  organization: (organizationId: number | string) =>
    `${API_NAMESPACES.v2}/sk_organization/${_segment(organizationId)}` as const,

  /** The StoreKnox organization's subscription: its trial, end date and licences. */
  subscription: (organizationId: number | string) =>
    `${API_NAMESPACES.v2}/sk_organization/${_segment(organizationId)}/sk_subscription` as const,

  /** Tells support the organization wants more monitoring licences. */
  creditRequest: () => `${API_NAMESPACES.v2}/feature_request/sk_credit` as const,

  /** Starts a store search, which the server runs and keeps under an id. */
  discovery: () => `${API_NAMESPACES.v2}/sk_discovery` as const,

  /** The apps one store search found. */
  discoveryResults: (searchId: number | string) =>
    `${API_NAMESPACES.v2}/sk_discovery/${_segment(searchId)}/search_results` as const,

  /** Whether a store listing is already in the inventory, or asked for; a 404 when it is neither. */
  approvalStatusCheck: () => `${API_NAMESPACES.v2}/sk_app/check_approval_status` as const,

  /** The apps a member has asked to add, with each one's decision. */
  requestedApps: () => `${API_NAMESPACES.v2}/sk_requested_apps` as const,
};
