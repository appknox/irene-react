import { akMT } from '@irene/translations/intl';
import type { IconName } from '@irene/ui/icons/sets';
import type { SideNavItemDefinition } from '@/components/side-nav/nav-item';
import type { FileRouteTypes } from '@/routeTree.gen';

/* Every page beneath offensive security, read from the generated tree. */
export type OffensiveSecurityNavRoute = Extract<
  FileRouteTypes['to'],
  `/dashboard/offensive-security${string}`
>;

/** One entry in the offensive security navigation, narrowed to the routes it leads to. */
export interface OffensiveSecurityNavItem extends SideNavItemDefinition {
  icon: IconName;
  to: OffensiveSecurityNavRoute;
}

/**
 * The offensive security navigation, which is its own product's rather than
 * the dashboard's.
 *
 * The product is one screen, so the list is one entry. It is built rather than
 * written inline so the labels follow the active locale.
 *
 * @returns One entry per page offensive security offers.
 */
export function buildOffensiveSecurityNavItems(): OffensiveSecurityNavItem[] {
  return [
    {
      id: 'offensive-security-attack-runs',
      label: akMT('offensiveSecurity.attackRuns'),
      icon: 'material-symbols:security',
      to: '/dashboard/offensive-security',
    },
  ];
}
