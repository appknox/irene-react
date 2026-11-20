import { faker } from '@faker-js/faker';

import { ENUMS } from '@irene/enums';

import type {
  ApiSkAiScoreLevel,
  ApiSkApp,
  ApiSkAppMetadata,
  ApiSkAppVersion,
  ApiSkCoreFile,
  ApiSkDiscoveryResult,
  ApiSkDiscoverySearch,
  ApiSkFakeApp,
  ApiSkFakeAppStore,
  ApiSkFileRisk,
  ApiSkInventoryApp,
  ApiSkOrganizationUser,
  ApiSkPlatform,
  ApiSkRequestedApp,
  ApiSkStoreInstance,
  ApiSkSubscription,
  ApiSkThirdPartyApp,
  ApiSkThirdPartyConfig,
  ApiSkThirdPartyFinding,
  ApiSkThirdPartyStore,
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

/** A store search the server has started, under its id. */
export const buildSkDiscoverySearch = (
  overrides: Partial<ApiSkDiscoverySearch> = {}
): ApiSkDiscoverySearch => {
  const query = overrides.query_str ?? faker.commerce.productName();

  return { id: _id(), query_str: query, query: { q: query }, ...overrides };
};

/** A store listing a search found, not yet tied to the inventory. */
export const buildSkDiscoveryResult = (
  overrides: Partial<ApiSkDiscoveryResult> = {}
): ApiSkDiscoveryResult => ({
  doc_ulid: faker.string.ulid(),
  doc_hash: faker.string.hexadecimal({ length: 32 }),
  app_id: faker.internet.domainName(),
  package_name: `com.${faker.word.noun()}.${faker.word.noun()}`,
  title: faker.commerce.productName(),
  platform: faker.helpers.arrayElement([ENUMS.PLATFORM.ANDROID, ENUMS.PLATFORM.IOS]),
  region: faker.location.countryCode(),
  app_url: faker.internet.url(),
  dev_name: faker.company.name(),
  dev_email: faker.internet.email(),
  icon_url: faker.image.url(),
  ...overrides,
});

/** A member's request to add an app, still waiting for an owner. */
export const buildPendingSkRequestedApp = (
  overrides: Partial<ApiSkRequestedApp> = {}
): ApiSkRequestedApp => ({
  ...buildPendingSkApp(),
  approved_by: null,
  rejected_by: null,
  ...overrides,
});

/** A member's request an owner approved, naming who and when. */
export const buildApprovedSkRequestedApp = (
  overrides: Partial<ApiSkRequestedApp> = {}
): ApiSkRequestedApp => ({
  ...buildSkApp(),
  approved_by: faker.person.fullName(),
  rejected_by: null,
  ...overrides,
});

/** A member's request an owner rejected, naming who and when. */
export const buildRejectedSkRequestedApp = (
  overrides: Partial<ApiSkRequestedApp> = {}
): ApiSkRequestedApp => ({
  ...buildSkApp({
    approval_status: ENUMS.SK_APPROVAL_STATUS.REJECTED,
    approval_status_display: 'Rejected',
    approved_on: null,
    rejected_on: faker.date.past().toISOString(),
  }),
  approved_by: null,
  rejected_by: faker.person.fullName(),
  ...overrides,
});

/* The rule keys the AI reports on; each present rule carries a score, a `_justification` and a level. */
const _AI_RULES = [
  'NativeLibsRule',
  'ObfuscationRule',
  'SigningCertRule',
  'EmbeddedFilesRule',
  'ManifestFlagsRule',
  'CertAttributesRule',
  'DynamicLoadingRule',
  'ImplicitIntentsRule',
  'PackerDetectionRule',
  'PermissionDeltaRule',
  'PhishingDomainsRule',
  'TitleBrandAbuseRule',
  'NetworkEndpointsRule',
  'PackageSimilarityRule',
  'SemanticSimilarityRule',
  'SpecialPermissionsRule',
  'SuspiciousApiChainsRule',
  'DeveloperConsistencyRule',
  'LogoSimilarityRule',
  'AppFunctionalitySimilarityRule',
];

const _AI_SCORE_LEVELS: ApiSkAiScoreLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

/** A faker-chosen subset of the rules, each with a score, a justification and a level. */
const _buildAiFindings = () => {
  const ai_scores: ApiSkFakeApp['ai_scores'] = {
    final: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
  };

  const ai_score_levels: ApiSkFakeApp['ai_score_levels'] = {};

  for (const rule of faker.helpers.arrayElements(_AI_RULES, { min: 3, max: 10 })) {
    ai_scores[rule] = faker.number.int({ min: 0, max: 100 });
    ai_scores[`${rule}_justification`] = faker.lorem.sentence();
    ai_score_levels[rule] = faker.helpers.arrayElement(_AI_SCORE_LEVELS);
  }

  return { ai_scores, ai_score_levels };
};

/** The store a copy was found on; a test that cares which pins `identifier`. */
export const buildSkFakeAppStore = (
  overrides: Partial<ApiSkFakeAppStore> = {}
): ApiSkFakeAppStore => {
  const platform =
    overrides.platform ?? faker.helpers.arrayElement([ENUMS.PLATFORM.ANDROID, ENUMS.PLATFORM.IOS]);

  return {
    id: _id(),
    name: platform === ENUMS.PLATFORM.IOS ? 'App Store' : 'Google Play Store',
    identifier: platform === ENUMS.PLATFORM.IOS ? 'appstore' : 'playstore',
    icon: faker.image.url(),
    platform,
    platform_display: _PLATFORM_DISPLAY[platform] ?? String(platform),
    ...overrides,
  };
};

/** A copy waiting for review that the AI took for a fake app. */
export const buildSkFakeApp = (overrides: Partial<ApiSkFakeApp> = {}): ApiSkFakeApp => ({
  id: _id(),
  status: ENUMS.SK_FAKE_APP_STATUS.PENDING,
  status_display: 'Pending',
  title: faker.commerce.productName(),
  package_name: `com.${faker.word.noun()}.${faker.word.noun()}`,
  app_url: faker.internet.url(),
  dev_name: faker.company.name(),
  fake_app_icon_url: faker.image.url(),
  store: buildSkFakeAppStore(),
  ..._buildAiFindings(),
  semantic_analysis_score: faker.number.int({ min: 0, max: 100 }),
  binary_similarity_score: faker.number.int({ min: 0, max: 100 }),
  binary_risk_score: faker.number.int({ min: 0, max: 100 }),
  ai_classification_label: 'fake_app',
  ai_classification_justification: faker.lorem.sentence(),
  reviewed_by: null,
  reviewed_on: null,
  ignore_reason: null,
  added_to_inventory_app: null,
  created_on: faker.date.past().toISOString(),
  ...overrides,
});

/** A copy waiting for review that the AI took for a misuse of the brand. */
export const buildBrandAbuseSkFakeApp = (overrides: Partial<ApiSkFakeApp> = {}) =>
  buildSkFakeApp({ ai_classification_label: 'brand_abuse', ...overrides });

/** A copy a reviewer dismissed, naming who, when and why. */
export const buildIgnoredSkFakeApp = (overrides: Partial<ApiSkFakeApp> = {}) =>
  buildSkFakeApp({
    status: ENUMS.SK_FAKE_APP_STATUS.IGNORED,
    status_display: 'Ignored',
    reviewed_by: faker.person.fullName(),
    reviewed_on: faker.date.recent().toISOString(),
    ignore_reason: faker.lorem.sentence(),
    ...overrides,
  });

/** A copy a reviewer dismissed and added to the inventory as the app it points to. */
export const buildAddedToInventorySkFakeApp = (overrides: Partial<ApiSkFakeApp> = {}) =>
  buildIgnoredSkFakeApp({
    status: ENUMS.SK_FAKE_APP_STATUS.ADDED_TO_INVENTORY,
    status_display: 'Added to inventory',
    added_to_inventory_app: _id(),
    ...overrides,
  });

/* Real region codes are uppercase; US, SG and SA have a `storeknox.regionNames` entry, the rest do not. */
const _REGIONS = ['US', 'SG', 'SA', 'IN', 'GB', 'DE'];

/** Which regions each store is scanned in, with at least one opted for each. */
export const buildSkThirdPartyConfig = (
  overrides: Partial<ApiSkThirdPartyConfig> = {}
): ApiSkThirdPartyConfig => ({
  frequency: faker.number.int({ min: 1, max: 30 }),
  playstore_regions_opted: faker.helpers.arrayElements(_REGIONS, {
    min: 1,
    max: 3,
  }),
  appstore_regions_opted: faker.helpers.arrayElements(_REGIONS, {
    min: 1,
    max: 3,
  }),
  top_apps_count: faker.number.int({ min: 10, max: 500 }),
  ...overrides,
});

/** One rule the third-party scan ran against an app. */
export const buildSkThirdPartyFinding = (
  overrides: Partial<ApiSkThirdPartyFinding> = {}
): ApiSkThirdPartyFinding => ({
  rule_id: faker.string.uuid(),
  name: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  severity: faker.helpers.arrayElement(['critical', 'high', 'medium', 'low', 'info']),
  status: faker.helpers.arrayElement(['triggered', 'clean', 'error', 'skipped']),
  details: [faker.lorem.sentence()],
  skip_reason: null,
  category: faker.lorem.word(),
  contributes_to_score: faker.datatype.boolean(),
  checks: faker.lorem.sentence(),
  business_impact: faker.lorem.sentence(),
  is_potential_risk: faker.datatype.boolean(),
  ...overrides,
});

/**
 * A scanned third-party app; its platform follows its store and its versions include the scanned one.
 * Its risk status is drawn from the enum; a test for an unrecognised code overrides `risk_status` with a number outside it.
 */
export const buildSkThirdPartyApp = (
  overrides: Partial<ApiSkThirdPartyApp> = {}
): ApiSkThirdPartyApp => {
  const store: ApiSkThirdPartyStore =
    overrides.store ?? faker.helpers.arrayElement(['appstore', 'playstore']);

  const version = overrides.version ?? faker.system.semver();

  return {
    package_name: faker.internet.domainName(),
    region: faker.helpers.arrayElement(_REGIONS),
    version,
    store,
    score: faker.number.int({ min: 0, max: 100 }),
    risk_status: faker.helpers.arrayElement([
      ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MINIMAL,
      ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MEDIUM,
      ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.HIGH,
    ]),
    scan_date: faker.date.recent().toISOString(),
    title: faker.company.name(),
    icon_url: faker.image.url(),
    dev_name: faker.person.fullName(),
    app_url: faker.internet.url(),
    platform: store === 'appstore' ? ENUMS.PLATFORM.IOS : ENUMS.PLATFORM.ANDROID,
    presigned_url: faker.internet.url(),
    versions: [version, faker.system.semver()],
    findings: [buildSkThirdPartyFinding()],
    ...overrides,
  };
};

/** A third-party app no scan has finished for, so it has no score. */
export const buildUnscoredSkThirdPartyApp = (overrides: Partial<ApiSkThirdPartyApp> = {}) =>
  buildSkThirdPartyApp({ score: null, ...overrides });
