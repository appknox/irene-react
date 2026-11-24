/**
 * ============================================================
 * ORGANIZATION
 * ============================================================
 */

/** All of the organization's features. */
export interface ApiOrganizationFeatures {
  app_monitoring: boolean;
  dynamicscan_automation: boolean;
  manualscan: boolean;
  partner_dashboard: boolean;
  sso: boolean;
  sbom: boolean;
  store_release_readiness: boolean;
  public_apis: boolean;
  storeknox: boolean;
  privacy: boolean;
  upload_via_url: boolean;
  cyod: boolean;
  member_override_request: boolean;
  offensive_security: boolean;
}

/** Organization-specific AI features. */
export interface ApiOrganizationAiFeatures {
  reporting: boolean;
  pii: boolean;
  knoxiq: boolean;
  ai_dast: boolean;
}

/**
 * Which of the organization's AI features are switched on.
 *
 * Separate from `ApiOrganizationAiFeatures`, which says which ones it is
 * entitled to: a feature can be bought and left off.
 */
export interface ApiOrganizationAiFeatureSettings {
  reporting: boolean;
  pii: boolean;
  auto_execute_knoxiq_on_cicd_upload: boolean;
}

/** All of the organization's properties. */
export interface ApiOrganization {
  id: number;
  name: string;
  logo: string;
  features: ApiOrganizationFeatures;
  ai_features: ApiOrganizationAiFeatures;
  billing_hidden: boolean;
  hide_upsell_features: boolean;
  enable_legacy_cvss_reports: boolean;
  is_trial: boolean;
  mandatory_mfa: boolean;
  cyod_registration_enabled: boolean;
  show_subscription: boolean;
  projects_count: number;
  namespaces_count: number;
  teams_count: number;
}

/**
 * ============================================================
 * MEMBERSHIP
 * ============================================================
 */

/**
 * The signed-in account's standing within one organization. A member is
 * neither an admin nor an owner, so the API states only the two.
 */
export interface ApiOrganizationMe {
  id: number;
  is_admin: boolean;
  is_owner: boolean;
  can_access_partner_dashboard: boolean;
  has_security_permission: boolean;
}

/**
 * One account's membership of an organization: how they joined it, rather than
 * what they may do in it. `member` is the account's own id.
 */
export interface ApiOrganizationMembership {
  member: number;
  role: number;
  role_display: string;
  is_admin: boolean;
  is_active: boolean;
  created_on: string;
  last_logged_in: string | null;
}

/**
 * ============================================================
 * STOREKNOX
 * ============================================================
 */

/** The StoreKnox features an organization is entitled to. */
export interface ApiStoreknoxFeatures {
  inventory: boolean;
  drift_detection: boolean;
  fake_app_detection: boolean;
  use_ai_validation: boolean;
  third_party_scanning: boolean;
}

/** Absent on a deployment without StoreKnox, which is not an error. */
export interface ApiStoreknoxOrganization {
  id: number;
  organization: number;
  created_on: string;
  updated_on: string;
  add_appknox_project_to_inventory_by_default: boolean;
  autodiscovery_onboarding_done: boolean;
  auto_discovery_enabled: boolean;
  sk_features: ApiStoreknoxFeatures;
}

/**
 * One invitation an organization has open, as the API sends it.
 *
 * `team` is the team's id alone, so an invitation into one is read as such
 * without naming it; the team itself is fetched where its name is shown.
 */
export interface ApiOrganizationInvitation {
  id: number;
  email: string;
  created_on: string;
  updated_on: string;
  team: number | null;
}

/** One team within an organization, as the API sends it. */
export interface ApiOrganizationTeam {
  id: number;
  name: string;
  created_on: string;
  members_count: number;
  projects_count: number;
}

/**
 * One person's place in a team.
 *
 * The API sends the member's id alone, so the name and address beside it are
 * read from the organization's users.
 */
export interface ApiOrganizationTeamMember {
  id: number;
}

/** One of an organization's projects, as its own list sends it. */
export interface ApiOrganizationProject {
  id: number;
  name: string;
  package_name: string;
  platform: number;
}

/** One project's place in a team, and whether the team may write to it. */
export interface ApiOrganizationTeamProject {
  id: number;
  write: boolean;
}

/** One member of an organization, as the records that refer to them read it. */
export interface ApiOrganizationUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}

/** One namespace an organization has claimed, as the API sends it. */
export interface ApiOrganizationNamespace {
  id: number;
  value: string;
  created_on: string;
  approved_on: string | null;
  is_approved: boolean;
  platform: number;
  approved_by: number | null;
  requested_by: number | null;
}
