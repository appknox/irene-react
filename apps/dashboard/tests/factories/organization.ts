import { faker } from '@faker-js/faker';

import type {
  ApiOrganization,
  ApiOrganizationAiFeatures,
  ApiOrganizationFeatures,
  ApiOrganizationMe,
  ApiOrganizationMembership,
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

export const buildOrganizationMembership = (
  overrides: Partial<ApiOrganizationMembership> = {}
): ApiOrganizationMembership => ({
  member: faker.number.int({ min: 1, max: 9999 }),
  role: 1,
  role_display: 'Owner',
  is_admin: true,
  is_active: true,
  created_on: faker.date.past().toISOString(),
  last_logged_in: faker.date.recent().toISOString(),
  ...overrides,
});

export const buildStoreknoxOrganization = (
  overrides: Partial<ApiStoreknoxOrganization> = {}
): ApiStoreknoxOrganization => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  organization: faker.number.int({ min: 1, max: 9999 }),
  created_on: faker.date.past().toISOString(),
  updated_on: faker.date.recent().toISOString(),
  add_appknox_project_to_inventory_by_default: false,
  autodiscovery_onboarding_done: false,
  auto_discovery_enabled: false,
  sk_features: {
    inventory: false,
    drift_detection: false,
    fake_app_detection: false,
    use_ai_validation: false,
    third_party_scanning: false,
  },
  ...overrides,
});
