import { faker } from '@faker-js/faker';

import { ENUMS } from '@irene/enums';

import type {
  ApiSkApp,
  ApiSkAppMetadata,
  ApiSkAppVersion,
  ApiSkCoreFile,
  ApiSkFileRisk,
  ApiSkInventoryApp,
  ApiSkOrganizationUser,
  ApiSkPlatform,
  ApiSkStoreInstance,
  ApiSkSubscription,
} from '@irene/api/services/storeknox';

const _id = () => faker.number.int({ min: 1, max: 99999 });

/* The name the server sends beside a platform code, so a listing never says one platform and shows the other. */
const _PLATFORM_DISPLAY: Partial<Record<ApiSkPlatform, string>> = {
  [ENUMS.PLATFORM.ANDROID]: 'android',
  [ENUMS.PLATFORM.IOS]: 'ios',
};

export const buildSkAppMetadata = (overrides: Partial<ApiSkAppMetadata> = {}): ApiSkAppMetadata => {
  const platform =
    overrides.platform ?? faker.helpers.arrayElement([ENUMS.PLATFORM.ANDROID, ENUMS.PLATFORM.IOS]);

  return {
    id: _id(),
    doc_ulid: faker.string.ulid(),
    doc_hash: faker.string.hexadecimal({ length: 32 }),
    app_id: faker.internet.domainName(),
    url: faker.internet.url(),
    icon_url: faker.image.url(),
    package_name: `com.${faker.word.noun()}.${faker.word.noun()}`,
    title: faker.commerce.productName(),
    platform,
    platform_display: _PLATFORM_DISPLAY[platform] ?? String(platform),
    dev_name: faker.company.name(),
    dev_email: faker.internet.email(),
    dev_website: faker.internet.url(),
    dev_id: faker.string.alphanumeric(10),
    rating: faker.number.float({ min: 0, max: 5, fractionDigits: 1 }),
    rating_count: faker.number.int({ max: 10000 }),
    review_count: faker.number.int({ max: 10000 }),
    total_downloads: faker.number.int({ max: 1000000 }),
    upload_date: faker.date.past().toISOString(),
    latest_upload_date: faker.date.recent().toISOString(),
    ...overrides,
  };
};

/** An approved, active app in the inventory with monitoring on and nothing to act on. */
export const buildSkApp = (overrides: Partial<ApiSkApp> = {}): ApiSkApp => ({
  id: _id(),
  app_discovery_query: null,
  approval_status: ENUMS.SK_APPROVAL_STATUS.APPROVED,
  approval_status_display: 'Approved',
  app_status: ENUMS.SK_APP_STATUS.ACTIVE,
  app_status_display: 'Active',
  app_source: faker.helpers.arrayElement([ENUMS.SK_DISCOVERY.AUTO, ENUMS.SK_DISCOVERY.MANUAL]),
  app_source_display: faker.word.words(1),
  monitoring_enabled: true,
  has_fake_apps: false,
  store_monitoring_status: ENUMS.SK_APP_MONITORING_STATUS.NO_ACTION_NEEDED,
  store_monitoring_status_display: 'No action needed',
  approved_on: faker.date.past().toISOString(),
  added_on: faker.date.past().toISOString(),
  updated_on: faker.date.recent().toISOString(),
  rejected_on: null,
  archived_on: null,
  decommissioned_on: null,
  unarchive_available_on: null,
  last_fake_detection_on: faker.date.recent().toISOString(),
  archived_by: null,
  license_allocated: 1,
  fake_app_detection_status: ENUMS.SK_FAKE_APP_DETECTION_STATUS.NO_RESULTS,
  fake_app_detection_status_display: 'No results',
  fake_app_counts: { brand_abuse: 0, fake_app: 0, ignored: 0 },
  availability: { storeknox: true, appknox: false },
  has_store_monitoring_data: true,
  has_fake_app_detection_data: true,
  app_metadata: buildSkAppMetadata(),
  added_by: _id(),
  approved_by: _id(),
  rejected_by: null,
  sk_organization: _id(),
  ...overrides,
});

/** An app waiting for an owner to let it into the inventory. */
export const buildPendingSkApp = (overrides: Partial<ApiSkApp> = {}) =>
  buildSkApp({
    approval_status: ENUMS.SK_APPROVAL_STATUS.PENDING_APPROVAL,
    approval_status_display: 'Pending approval',
    approved_on: null,
    approved_by: null,
    ...overrides,
  });

/** An archived app, which can be restored once its lock period has passed. */
export const buildArchivedSkApp = (overrides: Partial<ApiSkApp> = {}) =>
  buildSkApp({
    app_status: ENUMS.SK_APP_STATUS.ARCHIVED,
    app_status_display: 'Archived',
    archived_on: faker.date.past().toISOString(),
    archived_by: faker.internet.email(),
    unarchive_available_on: faker.date.past().toISOString(),
    ...overrides,
  });

/** An app as its details page reads it, with no Appknox project and nothing uploaded. */
export const buildSkInventoryApp = (
  overrides: Partial<ApiSkInventoryApp> = {}
): ApiSkInventoryApp => ({
  ...buildSkApp(),
  can_initiate_upload: true,
  submission_error_header: null,
  submission_error_message: null,
  last_monitored_on: faker.date.recent().toISOString(),
  core_project: null,
  core_project_latest_version: null,
  upload_submission: null,
  ...overrides,
});

export const buildSkStoreInstance = (
  overrides: Partial<ApiSkStoreInstance> = {}
): ApiSkStoreInstance => ({
  id: _id(),
  country_code: faker.location.countryCode(),
  icon: faker.image.url(),
  ...overrides,
});

/** The latest store version of an app, not yet scanned on Appknox. */
export const buildSkAppVersion = (overrides: Partial<ApiSkAppVersion> = {}): ApiSkAppVersion => ({
  id: _id(),
  version: faker.system.semver(),
  version_code: String(faker.number.int({ min: 1, max: 999 })),
  is_latest: true,
  can_initiate_upload: true,
  app_scan_status: 0,
  app_scan_status_display: 'Not scanned',
  submission_error_header: null,
  submission_error_message: null,
  created_on: faker.date.past().toISOString(),
  file_created_on: null,
  upload_submission: null,
  sk_app: _id(),
  file: null,
  sk_store_instances: [buildSkStoreInstance()],
  ...overrides,
});

export const buildSkSubscription = (
  overrides: Partial<ApiSkSubscription> = {}
): ApiSkSubscription => ({
  id: _id(),
  is_trial: false,
  end_date: faker.date.future().toISOString(),
  licenses_procured: faker.number.int({ min: 5, max: 50 }),
  licenses_remaining: faker.number.int({ min: 1, max: 5 }),
  is_active: true,
  is_license_tracking_applicable: true,
  updated_by: null,
  created_by: null,
  sk_organization: _id(),
  ...overrides,
});

export const buildSkCoreFile = (overrides: Partial<ApiSkCoreFile> = {}): ApiSkCoreFile => ({
  id: _id(),
  name: faker.commerce.productName(),
  version: faker.system.semver(),
  version_code: String(faker.number.int({ min: 1, max: 999 })),
  created_on: faker.date.recent().toISOString(),
  ...overrides,
});

export const buildSkFileRisk = (overrides: Partial<ApiSkFileRisk> = {}): ApiSkFileRisk => ({
  id: _id(),
  risk_count_critical: faker.number.int({ max: 20 }),
  risk_count_high: faker.number.int({ max: 20 }),
  risk_count_medium: faker.number.int({ max: 20 }),
  risk_count_low: faker.number.int({ max: 20 }),
  risk_count_passed: faker.number.int({ max: 200 }),
  risk_count_unknown: faker.number.int({ max: 20 }),
  ...overrides,
});

export const buildSkOrganizationUser = (
  overrides: Partial<ApiSkOrganizationUser> = {}
): ApiSkOrganizationUser => ({
  id: _id(),
  username: faker.internet.username(),
  email: faker.internet.email(),
  is_active: true,
  ...overrides,
});
