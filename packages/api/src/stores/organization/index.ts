import { createStore } from 'zustand/vanilla';

import type {
  ApiOrganization,
  ApiOrganizationAiFeatures,
  ApiOrganizationFeatures,
  ApiOrganizationMe,
} from '@irene/api/services/organization';

/** Which modules are hidden rather than advertised, one per module that is sold. */
export interface OrganizationUpsellStatus {
  privacy: boolean;
  sbom: boolean;
  storeReleaseReadiness: boolean;
  offensiveSecurity: boolean;
  dynamicScanAutomation: boolean;
  aiReporting: boolean;
  aiPii: boolean;
}

/**
 * The organization the app is working in, and what this account may do there.
 *
 * An account can belong to more than one organization, but the product shows
 * one at a time, so the choice is held here rather than passed down. `me` is
 * kept beside it because every permission check needs both.
 *
 * The readers answer for an organization that has not arrived yet, so a caller
 * reads a flag rather than guarding the whole chain. They are the one place the
 * entitlement rules are written: a screen asks what the account may open, not
 * which fields to compare.
 *
 * Lives in the API package because every app reads it: the choice decides which
 * organization the requests are about, not how one screen renders.
 *
 * @interface OrganizationStore
 * @property {ApiOrganization} selected - The organization in use, or null before one is chosen.
 * @property {ApiOrganizationMe} me - What this account may do in the selected organization.
 * @property {function} select - Records the organization in use, and the account's standing in it.
 * @property {function} selectedId - The selected organization's id, empty before one is chosen.
 * @property {function} clear - Forgets both, for signing out.
 * @property {function} features - What the organization is entitled to, all off before one arrives.
 * @property {function} aiFeatures - The AI entitlements, read the same way.
 * @property {function} hidesUpsell - Whether the organization is shown what it has not bought.
 * @property {function} upsellStatus - Per module, whether it is withheld rather than advertised.
 * @property {function} showsOffensiveSecurity - Whether offensive security is offered to this organization.
 * @property {function} isAdmin - Whether the account administers the organization.
 * @property {function} isOwner - Whether the account owns it.
 * @property {function} isMember - Whether it neither administers nor owns it.
 * @property {function} hasSecurityPermission - Whether the account may reach the security dashboard.
 * @property {function} canAccessPartnerDashboard - Whether the account may reach the partner dashboard.
 * @property {function} billingHidden - Whether billing is hidden for this organization.
 * @property {function} showsSubscription - Whether a subscription stands in for billing.
 * @property {function} projectsCount - How many projects the organization holds.
 */
interface OrganizationStore {
  selected: ApiOrganization | null;
  me: ApiOrganizationMe | null;
  select: (organization: ApiOrganization, me: ApiOrganizationMe) => void;
  clear: () => void;
  selectedId: () => string;

  features: () => ApiOrganizationFeatures;
  aiFeatures: () => ApiOrganizationAiFeatures;
  hidesUpsell: () => boolean;
  upsellStatus: () => OrganizationUpsellStatus;
  showsOffensiveSecurity: () => boolean;

  isAdmin: () => boolean;
  isOwner: () => boolean;
  isMember: () => boolean;
  hasSecurityPermission: () => boolean;
  canAccessPartnerDashboard: () => boolean;

  billingHidden: () => boolean;
  showsSubscription: () => boolean;
  projectsCount: () => number;
}

/** No organization selected */
const NO_ORGANIZATION_SELECTED = { selected: null, me: null };

/** Every feature off, for the stretch before an organization has arrived. */
const NO_FEATURES: ApiOrganizationFeatures = {
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
};

const NO_AI_FEATURES: ApiOrganizationAiFeatures = {
  reporting: false,
  pii: false,
  knoxiq: false,
  ai_dast: false,
};

export const organizationStore = createStore<OrganizationStore>((set, get) => ({
  ...NO_ORGANIZATION_SELECTED,
  select: (organization, me) => set({ selected: organization, me }),
  clear: () => set(NO_ORGANIZATION_SELECTED),

  features: () => get().selected?.features ?? NO_FEATURES,
  aiFeatures: () => get().selected?.ai_features ?? NO_AI_FEATURES,
  hidesUpsell: () => Boolean(get().selected?.hide_upsell_features),

  /* A module is withheld when the organization lacks it and is shown no upsell. */
  upsellStatus: () => {
    const features = get().features();
    const aiFeatures = get().aiFeatures();
    const hidesUpsell = get().hidesUpsell();

    return {
      privacy: !features.privacy && hidesUpsell,
      sbom: !features.sbom && hidesUpsell,
      storeReleaseReadiness: !features.store_release_readiness && hidesUpsell,
      offensiveSecurity: !features.offensive_security && hidesUpsell,
      dynamicScanAutomation: !features.dynamicscan_automation && hidesUpsell,
      aiReporting: !aiFeatures.reporting && hidesUpsell,
      aiPii: !aiFeatures.pii && hidesUpsell,
    };
  },

  /*
    Offered when the organization has it and is not being withheld the upsell.
    The second half cannot change the answer today — a withheld module is one
    the organization lacks — but both halves are stated so the rule survives a
    change to either.
  */
  showsOffensiveSecurity: () =>
    get().features().offensive_security && !get().upsellStatus().offensiveSecurity,

  isAdmin: () => Boolean(get().me?.is_admin),
  isOwner: () => Boolean(get().me?.is_owner),

  /* Neither administers nor owns, which is what the analytics and billing screens turn on. */
  isMember: () => !get().isAdmin() && !get().isOwner(),
  hasSecurityPermission: () => Boolean(get().me?.has_security_permission),
  canAccessPartnerDashboard: () => Boolean(get().me?.can_access_partner_dashboard),

  selectedId: () => String(get().selected?.id ?? ''),
  billingHidden: () => Boolean(get().selected?.billing_hidden),
  showsSubscription: () => Boolean(get().selected?.show_subscription),
  projectsCount: () => get().selected?.projects_count ?? 0,
}));
