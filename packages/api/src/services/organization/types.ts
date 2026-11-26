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

/** Which regulations an organization's reports carry, as the endpoint names them. */
export interface ApiReportPreference {
  show_pcidss: boolean;
  show_hipaa: boolean;
  show_gdpr: boolean;
  show_nist: boolean;
  show_sama: boolean;
  show_dora: boolean;
  show_eucra: boolean;
  show_popia: boolean;
}

/** An organization's preferences, of which the reports' regulations are the only part read here. */
export interface ApiOrganizationPreference {
  id: number;
  report_preference: ApiReportPreference;
}

/**
 * One device a member has registered with the organization.
 *
 * What it is called is whichever of its name, its model or its serial number it
 * has, as irene reads them in that order.
 */
export interface ApiOrganizationRegisteredDevice {
  id: number;
  name: string | null;
  serial_number: string;
  model: string;
  platform: number;
  is_connected: boolean;
  created_on: string | null;
}

/**
 * Whether old application binaries are cleaned up, and how many are kept.
 *
 * The endpoint answers 404 for an organization the feature is not set up for,
 * which is how the screen knows to leave the section out altogether.
 */
export interface ApiOrganizationCleanupPreference {
  id: number;
  is_enabled: boolean;

  /** How many of a project's most recent uploads keep their binaries, between 2 and 50. */
  files_to_keep: number;
  last_cleaned_at: string | null;
}

/** What one cleanup took out of one project. */
export interface ApiOrganizationCleanupProject {
  package_name: string;
  cleaned_files_count: number;
}

/** One cleanup that has run, by hand or on its own. */
export interface ApiOrganizationCleanup {
  id: number;
  user: number | null;
  created_on: string;
  projects: ApiOrganizationCleanupProject[];

  /** `Manual` where someone started it, and the schedule's own name otherwise. */
  type: string;
}

/** Whether single sign-on is on, and whether it is the only way in. */
export interface ApiOrganizationSso {
  id: number;
  enabled: boolean;

  /** Whether members may only sign in through the provider, with no password. */
  enforced: boolean;
}

/** The certificate an identity provider signs its assertions with. */
export interface ApiSamlCertificate {
  issuer: string;
  issued_on: string;
  expires_on: string;
  fingerprint_sha256: string;
  fingerprint_sha1: string;
}

/** What Appknox was told about the identity provider. */
export interface ApiSamlIdpMetadata {
  id: number;
  entity_id: string;
  sso_service_url: string;
  created_on: string;
  certificate: ApiSamlCertificate;
}

/** What an identity provider needs to know about Appknox. */
export interface ApiSamlSpMetadata {
  entity_id: string;
  acs_url: string;
  named_id_format: string;

  /** The same thing as XML, for a provider that takes a document rather than fields. */
  metadata: string;
}

/** The OpenID Connect provider an organization signs in through. */
export interface ApiOidcProvider {
  id: number;
  username: string;
  scopes_supported: string[];
  enabled: boolean;
  client_id: string;
  client_secret: string;
  discovery_url: string;
}

/** What is sent to set one up. */
export interface OidcProviderRequest {
  client_id: string;
  client_secret: string;
  discovery_url: string;
}

/** One iOS signing certificate an organization holds. */
export interface ApiOrganizationSigningCertificate {
  id: number;
  name: string | null;
  bundle_id: string | null;
  app_id: string | null;
  team_id: string | null;

  /** Whether apps are re-signed with this one, which only one of them is. */
  is_active: boolean;
  is_expired: boolean;
  provisions_all_devices: boolean;
  provisioned_udids: string[];
  expires_at: string | null;
}

/**
 * What is sent to add one.
 *
 * The signing material goes up base64-encoded in a JSON body rather than as a
 * multipart upload, which is how the endpoint takes it.
 */
export interface OrganizationSigningCertificateRequest {
  p12: string;
  mobileprovision: string;
  password: string;
  name: string;
  bundle_id: string;
}

/** Which export was asked for: everything, or each project's latest scan alone. */
export const ORGANIZATION_ARCHIVE_TYPE = { comprehensive: 0, latestScan: 1 } as const;

/** One of those two. */
export type ApiOrganizationArchiveType =
  (typeof ORGANIZATION_ARCHIVE_TYPE)[keyof typeof ORGANIZATION_ARCHIVE_TYPE];

/** Who asked for an export: someone on the dashboard, or Appknox's own systems. */
export const ORGANIZATION_ARCHIVE_GENERATED_VIA = { dashboard: 0, crm: 1 } as const;

/** One archive export. */
export interface ApiOrganizationArchive {
  id: number;
  created_on: string;

  /** When the file stops being available, after which it cannot be fetched. */
  available_until: string;
  generated_by: number | null;
  from_date: string | null;
  to_date: string | null;

  /** How much of it is ready, which is 100 once the file can be fetched. */
  progress_percent: number;
  generated_via: number;
  archive_type: ApiOrganizationArchiveType;
}

/** The span an export covers, either end of which may be left open. */
export interface OrganizationArchiveRequest {
  from_date?: string;
  to_date?: string;
}

/** One email domain an organization restricts its accounts to. */
export interface ApiOrganizationEmailDomain {
  id: number;
  domain_name: string;
}
