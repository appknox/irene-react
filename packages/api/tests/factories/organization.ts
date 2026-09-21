import { faker } from '@faker-js/faker';

import type {
  ApiDashboardConfig,
  ApiOrganization,
  ApiOrganizationAiFeatures,
  ApiOrganizationFeatures,
  ApiOrganizationMe,
  ApiStoreknoxOrganization,
} from '@irene/api/services/organization';

const buildFeatures = (
  overrides: Partial<ApiOrganizationFeatures> = {}
): ApiOrganizationFeatures => ({
  app_monitoring: false,
  dynamicscan_automation: false,
  manualscan: false,
  partner_dashboard: false,
  sso: false,
  sbom: false,
  store_release_readiness: false,
  public_apis: false,
  storeknox: false,
  privacy: false,
  upload_via_url: false,
  cyod: false,
  fake_app_detection: false,
  member_override_request: false,
  offensive_security: false,
  ...overrides,
});

const buildAiFeatures = (
  overrides: Partial<ApiOrganizationAiFeatures> = {}
): ApiOrganizationAiFeatures => ({
  reporting: false,
  pii: false,
  knoxiq: false,
  ai_dast: false,
  ...overrides,
});

export const buildOrganization = (overrides: Partial<ApiOrganization> = {}): ApiOrganization => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  name: faker.company.name(),
  logo: faker.internet.url(),
  features: buildFeatures(),
  ai_features: buildAiFeatures(),
  billing_hidden: false,
  hide_upsell_features: false,
  enable_legacy_cvss_reports: false,
  is_trial: false,
  mandatory_mfa: false,
  cyod_registration_enabled: false,
  show_subscription: true,
  knoxiq_automated_trigger: false,
  projects_count: faker.number.int({ min: 0, max: 99 }),
  namespaces_count: faker.number.int({ min: 0, max: 9 }),
  teams_count: faker.number.int({ min: 0, max: 9 }),
  ...overrides,
});

export const buildOrganizationMe = (
  overrides: Partial<ApiOrganizationMe> = {}
): ApiOrganizationMe => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  is_admin: false,
  is_owner: false,
  can_access_partner_dashboard: false,
  has_security_permission: false,
  ...overrides,
});

export const buildStoreknoxOrganization = (
  overrides: Partial<ApiStoreknoxOrganization> = {}
): ApiStoreknoxOrganization => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  ...overrides,
});

export const buildDashboardConfig = (
  overrides: Partial<ApiDashboardConfig> = {}
): ApiDashboardConfig => ({
  dashboard_url: faker.internet.url(),
  devicefarm_url: faker.internet.url(),
  ...overrides,
});
