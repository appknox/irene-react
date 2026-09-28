import { Outlet } from '@tanstack/react-router';

import { SideNav } from '@/components/side-nav';
import { useSidebarState } from '@/hooks/use-sidebar-state';

import { buildReportNavItems } from './nav-items';

/* Reporting remembers its own width, so collapsing it leaves the dashboard as it was. */
const SIDEBAR_STATE_KEY = 'irene-report-sidebar-state';

/**
 * The chrome every reporting page sits in.
 *
 * Reporting is its own product: it renders the shared navigation with its own
 * items, and the switcher leads back to the dashboard.
 */
export function ReportLayout() {
  const { isCollapsed, toggle } = useSidebarState(SIDEBAR_STATE_KEY);

  return (
    <div className="flex h-screen w-full overflow-hidden" data-test-report-layout>
      <SideNav items={buildReportNavItems()} isCollapsed={isCollapsed} onSidebarToggle={toggle} />

      <main className="flex-1 overflow-y-auto bg-background-subtle" data-test-report-main>
        <Outlet />
      </main>
    </div>
  );
}
