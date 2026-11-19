import type { ENUMS } from '@irene/enums';
import type { ApiSubmissionStatus } from '@irene/api/services/submission';

/* These read `BASE_VALUES` so the derived `UNKNOWN` is not taken for a value the server sends. */

/** Whether an app someone asked to add has been let into the inventory. */
export type ApiSkApprovalStatus = (typeof ENUMS.SK_APPROVAL_STATUS)['BASE_VALUES'][number];

/** Whether an app is in the inventory, archived, or gone from its store. */
export type ApiSkAppStatus = (typeof ENUMS.SK_APP_STATUS)['BASE_VALUES'][number];

/** What store monitoring last found for an app. */
export type ApiSkMonitoringStatus = (typeof ENUMS.SK_APP_MONITORING_STATUS)['BASE_VALUES'][number];

/** The monitoring states the inventory list filters by, which number differently. */
export type ApiSkMonitoringStatusFilter =
  (typeof ENUMS.SK_APP_MONITORING_STATUS_FILTER)['BASE_VALUES'][number];

/** What fake-app detection last found for an app. */
export type ApiSkFakeAppDetectionStatus =
  (typeof ENUMS.SK_FAKE_APP_DETECTION_STATUS)['BASE_VALUES'][number];

/** How an app came to be asked for: found by the system or searched for by a member. */
export type ApiSkDiscovery = (typeof ENUMS.SK_DISCOVERY)['BASE_VALUES'][number];

/** The platform a store listing is for. */
export type ApiSkPlatform = (typeof ENUMS.PLATFORM)['BASE_VALUES'][number];

/** The store listing an app was found on. */
export interface ApiSkAppMetadata {
  id: number;
  doc_ulid: string;
  doc_hash: string;
  app_id: string;
  url: string;
  icon_url: string;
  package_name: string;
  title: string;
  platform: ApiSkPlatform;
  platform_display: string;
  dev_name: string;
  dev_email: string;
  dev_website: string;
  dev_id: string;
  rating: number;
  rating_count: number;
  review_count: number;
  total_downloads: number;
  upload_date: string | null;
  latest_upload_date: string | null;
}

/** Whether an app is also a project on Appknox, or only watched on its store. */
export interface ApiSkAvailability {
  storeknox: boolean;
  appknox: boolean;
}

/** How many copies of an app fake-app detection has found, by kind. */
export interface ApiSkFakeAppCounts {
  brand_abuse: number;
  fake_app: number;
  ignored: number;
}

/** One app in the StoreKnox inventory, or asked to be added to it. */
export interface ApiSkApp {
  id: number;
  app_discovery_query: number | null;
  approval_status: ApiSkApprovalStatus;
  approval_status_display: string;
  app_status: ApiSkAppStatus;
  app_status_display: string;
  app_source: ApiSkDiscovery;
  app_source_display: string;
  monitoring_enabled: boolean;
  has_fake_apps: boolean;
  store_monitoring_status: ApiSkMonitoringStatus;
  store_monitoring_status_display: string;
  approved_on: string | null;
  added_on: string | null;
  updated_on: string | null;
  rejected_on: string | null;
  archived_on: string | null;
  decommissioned_on: string | null;
  unarchive_available_on: string | null;
  last_fake_detection_on: string | null;
  archived_by: string | null;
  license_allocated: number;
  fake_app_detection_status: ApiSkFakeAppDetectionStatus;
  fake_app_detection_status_display: string;
  fake_app_counts: ApiSkFakeAppCounts | null;
  availability: ApiSkAvailability;
  has_store_monitoring_data: boolean;
  has_fake_app_detection_data: boolean;
  app_metadata: ApiSkAppMetadata;
  added_by: number | null;
  approved_by: number | null;
  rejected_by: number | null;
  sk_organization: number;
}

/** One app as its details page reads it: the inventory row plus its Appknox side. */
export interface ApiSkInventoryApp extends ApiSkApp {
  can_initiate_upload: boolean;
  submission_error_header: string | null;
  submission_error_message: string | null;
  last_monitored_on: string | null;
  core_project: number | null;
  core_project_latest_version: number | null;
  upload_submission: number | null;
}

/** A store an app version is listed in, by country. */
export interface ApiSkStoreInstance {
  id: number;
  country_code: string;
  icon: string;
}

/** One version of an app seen on its store. */
export interface ApiSkAppVersion {
  id: number;
  version: string;
  version_code: string;
  is_latest: boolean;
  can_initiate_upload: boolean;
  app_scan_status: number;
  app_scan_status_display: string;
  submission_error_header: string | null;
  submission_error_message: string | null;
  created_on: string | null;
  file_created_on: string | null;
  upload_submission: number | null;
  sk_app: number;
  file: number | null;
  sk_store_instances: ApiSkStoreInstance[];
}

/** What the inventory list endpoint accepts. */
export interface ApiSkAppListRequest {
  limit: number;
  offset: number;
  approval_status: ApiSkApprovalStatus;
  /* A comma-separated list: the server reads `app_status=1,3`. */
  app_status: string;
  monitoring_status?: ApiSkMonitoringStatusFilter;
}

/** What the store-version list endpoint accepts. */
export interface ApiSkAppVersionListRequest {
  is_latest: boolean;
  limit?: number;
  offset?: number;
}

/** The server's answer to an approval decision. */
export interface ApiSkApprovalStatusResponse {
  id: number;
  approval_status: ApiSkApprovalStatus;
  approval_status_display: string;
}

/** The server's answer to turning store monitoring on or off. */
export interface ApiSkMonitoringStatusResponse {
  id: number;
  monitoring_enabled: boolean;
}

/** The server's answer to a request to fetch and upload a build: the submission it became. */
export interface ApiSkInitiateUploadResponse {
  id: number;
  url: string;
  status: ApiSubmissionStatus;
}

/** The inventory settings an owner can switch. */
export interface ApiSkOrganizationSettingsRequest {
  add_appknox_project_to_inventory_by_default?: boolean;
  auto_discovery_enabled?: boolean;
}

/** The StoreKnox organization's subscription. */
export interface ApiSkSubscription {
  id: number;
  is_trial: boolean;
  end_date: string | null;
  licenses_procured: number;
  licenses_remaining: number;
  is_active: boolean;
  is_license_tracking_applicable: boolean;
  updated_by: number | null;
  created_by: number | null;
  sk_organization: number;
}

/** The fields of an Appknox file the details page shows. */
export interface ApiSkCoreFile {
  id: number;
  name: string;
  version: string;
  version_code: string;
  created_on: string | null;
}

/** A file's finding counts, by severity. */
export interface ApiSkFileRisk {
  id: number;
  risk_count_critical: number;
  risk_count_high: number;
  risk_count_medium: number;
  risk_count_low: number;
  risk_count_passed: number;
  risk_count_unknown: number;
}

/** A member of the organization, as the users endpoint sends them. */
export interface ApiSkOrganizationUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}

/** A store search the server ran, kept under its id. */
export interface ApiSkDiscoverySearch {
  id: number;
  query_str: string;
  query: { q: string };
}

/** One store listing a search found, not yet tied to the inventory. */
export interface ApiSkDiscoveryResult {
  doc_ulid: string;
  doc_hash: string;
  app_id: string;
  package_name: string;
  title: string;
  platform: ApiSkPlatform;
  region: string;
  app_url: string;
  dev_name: string;
  dev_email: string;
  icon_url: string;
}

/** What the discovery results endpoint accepts. */
export interface ApiSkDiscoveryResultsRequest {
  limit: number;
  offset: number;
}

/** What adding a store listing to the inventory sends: the listing and the search it came from. */
export interface ApiSkAddToInventoryRequest {
  doc_ulid: string;
  app_discovery_query: number | string;
}

/** An app a member asked to add; the requests list names who decided, where the inventory carries ids. */
export interface ApiSkRequestedApp extends Omit<ApiSkApp, 'approved_by' | 'rejected_by'> {
  approved_by: string | null;
  rejected_by: string | null;
}
