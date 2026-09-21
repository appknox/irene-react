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
  fake_app_detection: boolean;
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
  knoxiq_automated_trigger: boolean;
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
 * ============================================================
 * STOREKNOX
 * ============================================================
 */

/** Absent on a deployment without StoreKnox, which is not an error. */
export interface ApiStoreknoxOrganization {
  id: number;
}

/**
 * ============================================================
 * DASHBOARD CONFIG
 * ============================================================
 */

/** Hosts the product links out to. A missing key leaves the existing default alone. */
export interface ApiDashboardConfig {
  dashboard_url?: string;
  devicefarm_url?: string;
}
