import { Outlet } from '@tanstack/react-router';
import { useMemo } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { PoweredByAiDrawer, type PoweredByAiSection } from '@/components/powered-by-ai';
import { SideNav } from '@/components/side-nav';
import { TopNav } from '@/components/top-nav';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useSignedInUser } from '@/hooks/use-signed-in-user';

import { buildReportNavItems } from './nav-items';

/**
 * The layout every reporting page sits in.
 *
 * Reporting is its own product: it renders the shared navigation with its own
 * items, and the switcher leads back to the dashboard. It keeps no
 * notifications of its own, so the bar carries no bell. It names itself there
 * instead, beside the mark saying an AI writes what it produces.
 */
export function ReportLayout() {
  const { isCollapsed, toggle } = useSidebarState();
  const user = useSignedInUser();

  /* What the drawer behind the AI chip explains about this product's AI. */
  const aiSections = useMemo<PoweredByAiSection[]>(
    () => [
      {
        title: akMT('reportModule.aiDataAccess'),
        body: akMT('reportModule.aiDataAccessDescription'),
      },
      {
        title: akMT('reportModule.aiDataUsage'),
        body: akMT('reportModule.aiDataUsageDescription'),
      },
      {
        title: akMT('reportModule.aiDataProtection'),
        points: [
          akMT('reportModule.aiDataProtectionList.item1'),
          akMT('reportModule.aiDataProtectionList.item2'),
          akMT('reportModule.aiDataProtectionList.item3'),
        ],
      },
    ],
    []
  );

  return (
    <div className="flex h-screen w-full overflow-hidden" data-test-report-layout>
      <SideNav items={buildReportNavItems()} isCollapsed={isCollapsed} onSidebarToggle={toggle} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav username={user.username} email={user.email} showNotifications={false}>
          <AkTypography variant="h5" fontWeight="bold" data-test-report-title>
            {akMT('reportModule.reportingEngine')}
          </AkTypography>

          <PoweredByAiDrawer sections={aiSections} />
        </TopNav>

        <main className="flex-1 overflow-y-auto bg-background-subtle" data-test-report-main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
