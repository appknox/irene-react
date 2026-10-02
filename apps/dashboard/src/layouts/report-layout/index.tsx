import { Outlet } from '@tanstack/react-router';

import { SideNav } from '@/components/side-nav';
import { TopNav } from '@/components/top-nav';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useSignedInUser } from '@/hooks/use-signed-in-user';

import { buildReportNavItems } from './nav-items';

/**
 * The layout every reporting page sits in.
 *
 * Reporting is its own product: it renders the shared navigation with its own
 * items, and the switcher leads back to the dashboard.
 */
export function ReportLayout() {
  const { isCollapsed, toggle } = useSidebarState();
  const user = useSignedInUser();

  return (
    <div className="flex h-screen w-full overflow-hidden" data-test-report-layout>
      <SideNav items={buildReportNavItems()} isCollapsed={isCollapsed} onSidebarToggle={toggle} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav username={user?.username ?? ''} email={user?.email ?? ''} />

        <main className="flex-1 overflow-y-auto bg-background-subtle" data-test-report-main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
