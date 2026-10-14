import { akMT } from '@irene/translations/intl';
import type { IconName } from '@irene/ui/icons/sets';
import type { SideNavItemDefinition } from '@/components/side-nav/nav-item';
import type { FileRouteTypes } from '@/routeTree.gen';

/* Every page beneath store monitoring, read from the generated tree. */
export type StoreknoxNavRoute = Extract<FileRouteTypes['to'], `/dashboard/storeknox/${string}`>;

/** One entry in the store monitoring navigation, narrowed to the routes it leads to. */
export interface StoreknoxNavItem extends SideNavItemDefinition {
  icon: IconName;
  to: StoreknoxNavRoute;
}

/** What the organization is entitled to within store monitoring. */
export interface StoreknoxNavAccess {
  detectsFakeApps: boolean;
  scansThirdPartyApps: boolean;
}

/**
 * The store monitoring navigation, which is its own product's rather than the
 * dashboard's.
 *
 * The inventory and discovery come with the product. Fake app detection and
 * third-party scanning are sold on top of it, so each is offered only to an
 * organization entitled to it.
 *
 * @param access - What the organization is entitled to within store monitoring.
 * @returns One entry per page store monitoring offers.
 */
export function buildStoreknoxNavItems(access: StoreknoxNavAccess): StoreknoxNavItem[] {
  const items: Array<StoreknoxNavItem | false> = [
    {
      id: 'storeknox-inventory',
      label: akMT('inventory'),
      icon: 'material-symbols:inventory-2',
      to: '/dashboard/storeknox/inventory/app-list',
    },

    {
      id: 'storeknox-discovery',
      label: akMT('discovery'),
      icon: 'material-symbols:search',
      to: '/dashboard/storeknox/discover/result',
    },

    access.detectsFakeApps && {
      id: 'storeknox-fake-apps',
      label: akMT('storeknox.fakeAppsTitle'),
      icon: 'streamline-plump:threat-phone',
      to: '/dashboard/storeknox/fake-apps',
    },

    access.scansThirdPartyApps && {
      id: 'storeknox-third-party-scans',
      label: akMT('storeknox.thirdPartyScansTitle'),
      icon: 'material-symbols:security',
      to: '/dashboard/storeknox/third-party-scans',
    },
  ];

  return items.filter((item) => item !== false);
}
