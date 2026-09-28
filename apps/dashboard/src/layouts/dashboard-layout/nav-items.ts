import { akMT } from '@irene/translations/intl';
import type { IconName } from '@irene/ui/icons/sets';
import type { SideNavItemDefinition } from '@/components/side-nav/nav-item';
import type { FileRouteTypes } from '@/routeTree.gen';

/*
  Every route the dashboard and the partner screens carry, read from the
  generated tree. A route that is renamed or removed fails to compile here
  rather than 404ing at runtime.
*/
export type DashboardNavRoute = Extract<
  FileRouteTypes['to'],
  `/dashboard/${string}` | `/partner/${string}`
>;

/** One entry in the dashboard's navigation, narrowed to the routes it leads to. */
export interface DashboardNavItem extends SideNavItemDefinition {
  icon: IconName;
  to: DashboardNavRoute;
}

/** What the account is entitled to, and what it may administer. */
export interface DashboardNavAccess {
  hasPublicApis: boolean;
  hasPrivacy: boolean;
  hasSbom: boolean;
  hasStoreReleaseReadiness: boolean;
  hidesPrivacyUpsell: boolean;
  hidesSbomUpsell: boolean;
  hidesStoreReleaseReadinessUpsell: boolean;
  isEnterprise: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  billingHidden: boolean;
  hasMarketplace: boolean;
  canAccessPartnerDashboard: boolean;
  showsSubscription: boolean;
  projectsCount: number;
}

/**
 * The navigation this account sees, in order.
 *
 * Projects, the organization and account settings are always offered. The rest
 * follow what the organization bought and what the account may administer, so a
 * member sees a shorter list than an owner.
 *
 * @param access - The organization's entitlements and the account's standing in it.
 * @returns One entry per item on offer.
 */
export function buildDashboardNavItems(access: DashboardNavAccess): DashboardNavItem[] {
  const { isAdmin, isOwner, billingHidden, projectsCount, hasMarketplace } = access;
  const isAdminOrOwner = isAdmin || isOwner;
  const showsBilling = !billingHidden && isOwner;

  const items: Array<DashboardNavItem | false> = [
    {
      id: 'projects',
      label: akMT('allProjects'),
      icon: 'material-symbols:folder',
      to: '/dashboard/projects',
      badge: String(projectsCount),
    },

    /* Sold, so a self-hosted install is never offered either module. */
    !access.isEnterprise &&
      !access.hidesPrivacyUpsell && {
        id: 'privacy',
        label: akMT('privacyModule.title'),
        icon: 'material-symbols:shield-outline',
        to: '/dashboard/privacy-module',
      },

    !access.isEnterprise &&
      !access.hidesSbomUpsell && {
        id: 'sbom',
        label: akMT('SBOM'),
        icon: 'material-symbols:receipt-long',
        to: '/dashboard/sbom/apps',
      },

    !access.hidesStoreReleaseReadinessUpsell && {
      id: 'store-release-readiness',
      label: akMT('storeReleaseReadiness.title'),
      icon: 'material-symbols:list-alt-check',
      to: '/dashboard/store-release-readiness',
    },

    isAdminOrOwner && {
      id: 'analytics',
      label: akMT('analytics'),
      icon: 'material-symbols:graphic-eq',
      to: '/dashboard/analytics',
    },

    {
      id: 'organization',
      label: akMT('organization'),
      icon: 'material-symbols:group',
      to: '/dashboard/organization/namespaces',
    },

    access.hasPublicApis && {
      id: 'public-api',
      label: akMT('apiDocumentation'),
      icon: 'hugeicons:api',
      to: '/dashboard/public-api/docs',
    },

    {
      id: 'account-settings',
      label: akMT('accountSettings'),
      icon: 'material-symbols:account-box',
      to: '/dashboard/settings/general',
    },

    hasMarketplace && {
      id: 'marketplace',
      label: akMT('marketplace'),
      icon: 'material-symbols:account-balance',
      to: '/dashboard/marketplace',
    },

    showsBilling && {
      id: 'billing',
      label: akMT('billing'),
      icon: 'material-symbols:credit-card-outline',
      to: '/dashboard/billing',
    },

    access.showsSubscription &&
      isAdminOrOwner &&
      !showsBilling && {
        id: 'subscription',
        label: akMT('subscription'),
        icon: 'mdi:file-certificate-outline',
        to: '/dashboard/subscription',
      },

    access.canAccessPartnerDashboard && {
      id: 'clients',
      label: akMT('clients'),
      icon: 'material-symbols:groups-2',
      to: '/partner/clients',
      badge: akMT('beta'),
    },
  ];

  return items.filter((item) => item !== false);
}
