import { akMT } from '@irene/translations/intl';
import type { IconName } from '@irene/ui/icons/sets';
import type { SideNavItemDefinition } from '@/components/side-nav/nav-item';
import type { FileRouteTypes } from '@/routeTree.gen';

/* Every page beneath reporting, read from the generated tree. */
export type ReportNavRoute = Extract<FileRouteTypes['to'], `/dashboard/reports/${string}`>;

/** One entry in the reporting navigation, narrowed to the routes it leads to. */
export interface ReportNavItem extends SideNavItemDefinition {
  icon: IconName;
  to: ReportNavRoute;
}

/**
 * The reporting navigation, which is the same for every account that reaches it.
 *
 * Reporting is sold as one thing: an account either has it or never sees this
 * chrome, so nothing here is gated.
 *
 * @returns One entry per page reporting offers.
 */
export function buildReportNavItems(): ReportNavItem[] {
  return [
    {
      id: 'generate-report',
      label: akMT('reportModule.generateReport'),
      icon: 'material-symbols:auto-awesome',
      to: '/dashboard/reports/generate',
    },
  ];
}
